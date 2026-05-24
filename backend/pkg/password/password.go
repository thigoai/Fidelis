package password

import "golang.org/x/crypto/bcrypt"

// cost 10 = ~80ms por hash em hardware moderno. Acima disso, ataques de
// timing/forca-bruta ficam inviaveis sem encarecer login legitimo.
const cost = 10

func Hash(plain string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(plain), cost)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// Verify retorna nil se o plain corresponde ao hash, ou um erro caso contrario.
// Use errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) para diferenciar
// senha errada de erro estrutural.
func Verify(hash, plain string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain))
}
