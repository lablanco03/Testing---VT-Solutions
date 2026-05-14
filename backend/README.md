# Backend VT Solutions

## Descripción
Backend del proyecto de comercio electrónico desarrollado con Node.js, Express y MongoDB.

---

## Estructura del proyecto
- config/: conexión y configuración
- models/: modelos de MongoDB
- controllers/: lógica del sistema
- routes/: endpoints de la API
- services/: servicios auxiliares y API externa

---

## Requisitos
- Node.js instalado
- MongoDB ejecutándose en local

---

## Ejecución del proyecto

1. Instalar dependencias:

```bash
npm install

2. Ejecutar el servidor:
npm run dev

3.  Probar en el navegador:
 http://localhost:3000/api/test

## Rutas base de la API
/api/auth
/api/products
/api/cart
/api/orders
/api/external

## Reglas del equipo
No cambiar nombres de rutas ni archivos
Cada persona trabaja en su carpeta asignada
Probar antes de hacer merge

## Responsabilidades
Persona 1: Backend base, estructura, conexión a MongoDB
Persona 2: Modelos (models)
Persona 3: Controladores y rutas
Persona 4: Integración frontend y API externa