// Comando de seed para o ambiente de desenvolvimento.
//
// Cria: 1 lojista, 1 cliente, 1 loja com o lojista como owner, 3 recompensas
// e 1000 pontos de bonus para o cliente (para testar resgate sem precisar
// rodar /api/stores/:id/points primeiro).
//
// Idempotente via TRUNCATE — APAGA TODOS OS DADOS DAS TABELAS NEGOCIAIS.
// So use em ambiente de desenvolvimento.
//
// Como rodar (stack subindo via docker compose):
//   docker compose exec backend go run ./cmd/seed
package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/fidelis/api/internal/model"
	"github.com/fidelis/api/pkg/password"
)

const (
	lojistaEmail = "lojista@fidelis.dev"
	lojistaPwd   = "lojista123"
	clienteEmail = "cliente@fidelis.dev"
	clientePwd   = "cliente123"
	storeSlug    = "loja-demo"
	initialBonus = 1000
)

type seedReward struct {
	name   string
	desc   string
	points int
}

var seedRewards = []seedReward{
	{"Cafe pequeno", "Um cafe expresso por conta da casa", 50},
	{"Desconto de 10%", "Vale 10% off na proxima compra", 200},
	{"Brinde especial", "Um item surpresa selecionado pela loja", 500},
}

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL e obrigatoria")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		log.Fatalf("connect: %v", err)
	}
	defer conn.Close(ctx)

	// TRUNCATE bypassa o trigger BEFORE DELETE no ledger (que so bloqueia
	// DELETE row-level). CASCADE propaga para tabelas dependentes.
	if _, err := conn.Exec(ctx,
		`TRUNCATE point_transactions, memberships, store_members, rewards, stores, users CASCADE`,
	); err != nil {
		log.Fatalf("wipe: %v", err)
	}

	lojistaHash, err := password.Hash(lojistaPwd)
	if err != nil {
		log.Fatalf("hash lojista: %v", err)
	}
	clienteHash, err := password.Hash(clientePwd)
	if err != nil {
		log.Fatalf("hash cliente: %v", err)
	}

	tx, err := conn.Begin(ctx)
	if err != nil {
		log.Fatalf("begin: %v", err)
	}
	defer tx.Rollback(ctx)

	var lojistaID, clienteID, storeID string

	if err := tx.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, name, role)
		 VALUES ($1, $2, $3, $4) RETURNING id`,
		lojistaEmail, lojistaHash, "Lojista Demo", model.RoleLojista,
	).Scan(&lojistaID); err != nil {
		log.Fatalf("create lojista: %v", err)
	}

	if err := tx.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, name, role)
		 VALUES ($1, $2, $3, $4) RETURNING id`,
		clienteEmail, clienteHash, "Cliente Demo", model.RoleCliente,
	).Scan(&clienteID); err != nil {
		log.Fatalf("create cliente: %v", err)
	}

	if err := tx.QueryRow(ctx,
		`INSERT INTO stores (slug, name, primary_color)
		 VALUES ($1, $2, $3) RETURNING id`,
		storeSlug, "Loja Demo", "#7c3aed",
	).Scan(&storeID); err != nil {
		log.Fatalf("create store: %v", err)
	}

	if _, err := tx.Exec(ctx,
		`INSERT INTO store_members (store_id, user_id, role) VALUES ($1, $2, 'owner')`,
		storeID, lojistaID,
	); err != nil {
		log.Fatalf("link owner: %v", err)
	}

	for _, rw := range seedRewards {
		if _, err := tx.Exec(ctx,
			`INSERT INTO rewards (store_id, name, description, points_cost)
			 VALUES ($1, $2, $3, $4)`,
			storeID, rw.name, rw.desc, rw.points,
		); err != nil {
			log.Fatalf("create reward %q: %v", rw.name, err)
		}
	}

	// Bonus inicial para o cliente. O trigger cria a membership e atualiza saldo.
	if _, err := tx.Exec(ctx,
		`INSERT INTO point_transactions
		     (customer_user_id, store_id, type, points, notes, created_by_user_id)
		 VALUES ($1, $2, 'bonus', $3, 'Saldo inicial do seed', $4)`,
		clienteID, storeID, initialBonus, lojistaID,
	); err != nil {
		log.Fatalf("seed bonus: %v", err)
	}

	if err := tx.Commit(ctx); err != nil {
		log.Fatalf("commit: %v", err)
	}

	log.Println("seed concluido:")
	log.Printf("  lojista: %s / %s  (id=%s)", lojistaEmail, lojistaPwd, lojistaID)
	log.Printf("  cliente: %s / %s  (id=%s)  saldo=%d", clienteEmail, clientePwd, clienteID, initialBonus)
	log.Printf("  loja:    %s             (id=%s)", storeSlug, storeID)
	log.Printf("  rewards: %d criadas (50, 200, 500 pontos)", len(seedRewards))
}
