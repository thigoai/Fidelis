package repository

import "errors"

// ErrNotFound e o erro canonico devolvido por repositorios quando uma busca
// pontual nao retorna linhas. Use errors.Is para detectar.
var ErrNotFound = errors.New("not found")
