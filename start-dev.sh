#!/bin/bash

# start-dev.sh
# Script para levantar todos los servicios del proyecto de forma concurrente

echo "======================================"
echo "Iniciando Entorno de Desarrollo ITAM"
echo "======================================"

# Ejecutaremos la nueva directiva agregada en el package.json root
# usando "concurrently" vía npx, lo que unificará la consola
# dándole diferentes colores a cada hilo y si un servicio muere o se cierra con Ctrl+C, cierra todos.

npm run dev:all
