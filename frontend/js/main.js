console.log("VT Solutions landing page cargada correctamente");

const form = document.getElementById("form-contacto");

const nombreInput = document.getElementById("nombre");
const emailInput = document.getElementById("email");
const mensajeInput = document.getElementById("mensaje");

form.addEventListener("submit", (e) => {
  e.preventDefault(); 

  const nombre = nombreInput.value.trim();
  const email = emailInput.value.trim();
  const mensaje = mensajeInput.value.trim();

  if(nombre.length < 3){
      alert("El nombre debe ser mayor a 3 caracteres");
      nombreInput.focus();
      return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(!emailRegex.test(email)){
      alert("Ingrese un correo válido");
      emailInput.focus();
      return;
  }

  if(mensaje.length < 10){
      alert("El mensaje debe tener al menos 10 caracteres");
      mensajeInput.focus();
      return;
  }

  alert("¡Formulario enviado correctamente!");
  form.reset(); 
});