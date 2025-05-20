# Web UI de detección de racimos

### Como descargar y levantar el proyecto:

1. Clonar repositorio

2. Ir a la carpeta FastApi y levantar el BackEnd con ```uvicorn main:app --reload```

3. Ir a la carpeta web_ui y levantar el html con Live Server

### Como utilizar la Web UI:

1. Subir uno o varios videos en el formulario

2. Elegir un video para ver las fases del mismo

3. El BackEnd envia una fase nueva cada 5 segundos

4. Se puede descargar el output con el boton "Descargar Output"

### Cosas a tener en cuenta:

1. El resto del formulario (Opciones de trackeo y demas) no tiene ninguna funcion. Hay que implementarlas.

2. El visor de fases solo se actualiza al cambiar de video. No se mostraran fases nuevas hasta que el usuario no seleccione otro video.

3. 
