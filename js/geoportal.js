// ===== iniciar documento de javascript =====
$(document).ready(function () {

  // -- inicializar funciones --
  // mapa
  inicializar_mapa();
  // supabase
  iniciar_supabase();

});

// ===== funciones =====

// -- funcion para inicializar el mapa --
async function inicializar_mapa() {

  // seteo de coordenadas para ecuador
  map = L.map("map").setView([-0.6312, -78.1834], 9.2);

  // capa de atribución
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "",
  }).addTo(map);

  // deshabilitación de zoom mouse (opcional)
  //map.scrollWheelZoom.disable();

}

// -- Iniciar conexion a supabase --
async function iniciar_supabase() {

  // url supabase (cambiar por url propia)
  supabase_url = "https://yjnjythotlpdnrtfyikf.supabase.co"
  // api key supabase (cambiar por api propia)
  supabase_api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlqbmp5dGhvdGxwZG5ydGZ5aWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTM0NDQsImV4cCI6MjA2NjI4OTQ0NH0.aSbnmzOqSR4NUyXQ-RdE2aBdq1qugM5ZTeLsvnukt9I"
  // conexion supabase
  supabase = window.supabase.createClient(supabase_url, supabase_api_key);

  // consultas iniciales de supabase
  obtener_filtros_geograficos();

  // consultas de capas
  iniciar_capas();

}

// -- Iniciar filtros geograficos turismo --
async function obtener_filtros_geograficos() {

  // - iniciar cantones
  let datos_cantones = await supabase.rpc("obtener_cantones");

  if (datos_cantones.error) console.error(datos_cantones.error);

  var cmb_cantones = new componente.cmb();
  cmb_cantones.ini("filtro_cantones");
  cmb_cantones.addCmbDataSupabase(datos_cantones.data);
  $("#filtro_cantones").prop("disabled", false);

  // - iniciar parroquias
  let datos_parroquias = await supabase.rpc("obtener_parroquias", {
    id_canton: "",
  });

  if (datos_parroquias.error) console.error(datos_parroquias.error);

  var cmb_parroquias = new componente.cmb();
  cmb_parroquias.ini("filtro_parroquias");
  cmb_parroquias.addCmbDataSupabase(datos_parroquias.data);
  $("#filtro_parroquias").prop("disabled", true);

  // - logica de cantones
  $("#filtro_cantones").on("change", async function () {
    valor_canton = $(this).val(); // Obtiene el valor seleccionado
    if (valor_canton == "") {
      $("#filtro_parroquias").val(0).trigger("change");
      $("#filtro_parroquias").prop("disabled", true);
    } else {
      $("#filtro_parroquias").prop("disabled", false);
      $("#filtro_parroquias").val(0).trigger("change");

      // - actualiza parroquias
      cmb_parroquias.clear();
      let datos_parroquias = await supabase.rpc("obtener_parroquias", {
        id_canton: valor_canton,
      });

      if (datos_parroquias.error) console.error(datos_parroquias.error);

      cmb_parroquias.addCmbDataSupabase(datos_parroquias.data);
    }
  });

  // boton de actualizar puntos
  $(".btn-graficar").click(function () {
    actualizar_capas();
  });

}

// -- iniciar capas --
async function iniciar_capas() {

  // iniciar mensaje de carga de capas
  let timerInterval;
  Swal.fire({
    title: "Cargando capas...",
    html: "",
    timerProgressBar: true,
    didOpen: () => {
      Swal.showLoading();
    },
  });


  // - iniciar capa sectores personas afectadas
  let datos_sectores_personas_afectadas = await supabase.rpc('obtener_sectores_personas_afectadas', {
    id_canton:null, id_parroquia:null, 
    limite: parseInt($('#limite-datos-sectores_personas_afectadas').val()), 
    orden:$('#order-datos-sectores_personas_afectadas').val() 
  })

  if (datos_sectores_personas_afectadas.error) console.error(datos_sectores_personas_afectadas.error);

  // pintar capa
  graficar_capa(
    datos_sectores_personas_afectadas.data, // los datos recibidos
    "#8f1dfaff", // color
    "sectores_personas_afectadas", // base
    true, // activar al cargar
    "Personas afectadas" // título
  );


  // - iniciar capa deslizamientos
  let datos_deslizamientos = await supabase.rpc('obtener_deslizamientos', {
    id_canton:null, 
    id_parroquia:null, 
    orden:$('#order-datos-sectores_personas_afectadas').val(),
    limite:parseInt($('#limite-datos-sectores_personas_afectadas').val())
  })

  if (datos_deslizamientos.error) console.error(datos_deslizamientos.error);

  // pintar capa
  graficar_capa(
    datos_deslizamientos.data, // los datos recibidos
    "#fb6824ff", // color
    "deslizamientos", // base
    false, // activar al cargar
    "Deslizamientos" // título
  );

  // - iniciar capa inundaciones
  let datos_inundaciones = await supabase.rpc('obtener_inundaciones', {
    id_canton:null, 
    id_parroquia:null, 
    orden:$('#order-datos-sectores_personas_afectadas').val(),
    limite:parseInt($('#limite-datos-sectores_personas_afectadas').val())
  })

  if (datos_inundaciones.error) console.error(datos_inundaciones.error);

  // pintar capa
  graficar_capa(
    datos_inundaciones.data, // los datos recibidos
    "#244ffbff", // color
    "inundaciones", // base
    false, // activar al cargar
    "Inundaciones" // título
  );

  // - iniciar capa incidencias
  let datos_incidencias = await supabase.rpc('obtener_incidencias', {
    id_canton:null, 
    id_parroquia:null, 
    orden:$('#order-datos-sectores_personas_afectadas').val(),
    limite:parseInt($('#limite-datos-sectores_personas_afectadas').val())
  })

  if (datos_incidencias.error) console.error(datos_incidencias.error);

  // - llamar a funcion para graficar puntos
  graficar_puntos(datos_incidencias.data, 'incidencias', false, 'Incidencias');

  // cerrar mensaje de carga de capas
  Swal.close()

}

// -- actualizar turismo --
async function actualizar_capas() {

  // - limpiar poligonos
  clear_polygons(0);

  // cantón
  let canton = $("#filtro_cantones").val();
  canton = canton === "0" ? null : canton;

  // parroquia
  let parroquia = $("#filtro_parroquias").val();
  parroquia = parroquia === "0" ? null : parroquia;

  let limite = parseInt($('#limite-datos-sectores_personas_afectadas').val());
  let orden = $('#order-datos-sectores_personas_afectadas').val();

  
  // iniciar mensaje de carga de capas
  let timerInterval;
  Swal.fire({
    title: "Actualizando capas...",
    html: "",
    timerProgressBar: true,
    didOpen: () => {
      Swal.showLoading();
    },
  });


  // - iniciar capa sectores personas afectadas
  let datos_sectores_personas_afectadas = await supabase.rpc('obtener_sectores_personas_afectadas', {
    id_canton:canton, 
    id_parroquia:parroquia, 
    limite: limite, 
    orden: orden
  })

  if (datos_sectores_personas_afectadas.error) console.error(datos_sectores_personas_afectadas.error);
  console.log('Sectores: ', document.getElementById("capa_sectores_personas_afectadas").checked )
  // pintar capa
  graficar_capa(
    datos_sectores_personas_afectadas.data, // los datos recibidos
    "#8f1dfaff", // color
    "sectores_personas_afectadas", // base
    document.getElementById("capa_sectores_personas_afectadas").checked , // activar al cargar
    "Personas afectadas" // título
  );

  // - iniciar capa deslizamientos
  let datos_deslizamientos = await supabase.rpc('obtener_deslizamientos', {
    id_canton:canton, 
    id_parroquia:parroquia,
    orden:orden,
    limite:limite
  })

  if (datos_deslizamientos.error) console.error(datos_deslizamientos.error);
  console.log('deslizamientos: ', document.getElementById("capa_deslizamientos").checked )
  // pintar capa
  graficar_capa(
    datos_deslizamientos.data, // los datos recibidos
    "#fb6824ff", // color
    "deslizamientos", // base
    document.getElementById("capa_deslizamientos").checked , // activar al cargar
    "Deslizamientos" // título
  );

  // - iniciar capa inundaciones
  let datos_inundaciones = await supabase.rpc('obtener_inundaciones', {
    id_canton:canton, 
    id_parroquia:parroquia, 
    orden:orden,
    limite:limite
  })

  if (datos_inundaciones.error) console.error(datos_inundaciones.error);
  console.log('inundaciones: ', document.getElementById("capa_inundaciones").checked )
  // pintar capa
  graficar_capa(
    datos_inundaciones.data, // los datos recibidos
    "#244ffbff", // color
    "inundaciones", // base
    document.getElementById("capa_inundaciones").checked , // activar al cargar
    "Inundaciones" // título
  );

  // - iniciar capa incidencias
  let datos_incidencias = await supabase.rpc('obtener_incidencias', {
    id_canton:canton, 
    id_parroquia:parroquia, 
    orden:orden,
    limite:limite
  })

  if (datos_incidencias.error) console.error(datos_incidencias.error);
  console.log('incidencias: ', document.getElementById("capa_incidencias").checked )
  // - llamar a funcion para graficar puntos
  graficar_puntos(datos_incidencias.data, 'incidencias', document.getElementById("capa_incidencias").checked , 'Incidencias');

  // cerrar mensaje de carga de capas
  Swal.close()


}

// -- graficar capas --
async function graficar_capa(datos, color, base, activar, titulo) {

  // iniciar capa vacia
  let capa_datos = L.layerGroup();

  // obtener controles de opacidad del menu desplegable
  const rango_opacidad = document.getElementById("opacity-range-" + base);
  const valor_opacidad = document.getElementById("opacity-value-" + base);
  const checkbox = document.getElementById("capa_" + base);

  // limpiar capa
  capa_datos.clearLayers();

  // recorrer datos
  datos.forEach((item) => {

    // transformar datos json
    const geojson = JSON.parse(item.geojson);

    // establecer datos de capa
    const geojson_capa = L.geoJSON(geojson, {

      // seteo de estilos de capa
      style: {
        color: color,
        weight: 2,
        opacity: 0.75,
        fillOpacity: 0.5,
      },
    });

    // agregar evento de apertura de modal con informacion
    geojson_capa.on("click", function () {

      // iniciar funcion de modal para visualizar informacion
      mostrar_info_modal(item,titulo);

    });

    // agregar capa al arreglo de capa
    geojson_capa.addTo(capa_datos);

    // asignar propiedad
    geojson_capa.db_polygono = 0;

  });

  // control checkbox
  if (checkbox) {

    // evitar event listeners duplicados, clonar y reemplazar
    const newCheckbox = checkbox.cloneNode(true);
    checkbox.parentNode.replaceChild(newCheckbox, checkbox);

    // establecer evento de encendido de check
    newCheckbox.checked = activar;
    if (activar) {

      // agregar capa al mapa
      capa_datos.addTo(map);
      // mostrar boton de opacidad
      $("#grupo-opacidad-" + base).show();

      var elemento_detalles = $("#grupo-detalles-" + base);
      if (elemento_detalles.length) {
          elemento_detalles.show(); // o elemento.hide();
      }

    }

    // capturar evento de checkbox por capa
    newCheckbox.addEventListener("change", (e) => {

      // si checkbox esta en estado true
      if (e.target.checked) {

        // encender capa en el mapa
        map.addLayer(capa_datos);
        // mostrar boton de opacidad
        $("#grupo-opacidad-" + base).show();
        var elemento_detalles = $("#grupo-detalles-" + base);
        if (elemento_detalles.length) {
            elemento_detalles.show(); // o elemento.hide();
        }
        // establecer rangos de boton de opacidad
        if (valor_opacidad) valor_opacidad.innerHTML = "0.5";
        if (rango_opacidad) rango_opacidad.value = 0.5;
        // restablecer estilo de capa
        capa_datos.eachLayer((layer) =>
          layer.setStyle({ weight: 2, opacity: 0.75, fillOpacity: 0.5 })
        );

      } 
      // si checkbox esta en estado false
      else {

        // descativar capa
        map.removeLayer(capa_datos);
        // ocultar boton de opacidad
        $("#grupo-opacidad-" + base).hide();
        var elemento_detalles = $("#grupo-detalles-" + base);
        if (elemento_detalles.length) {
            elemento_detalles.hide(); // o elemento.hide();
        }
        // restablecer valores boton de opacidad
        if (valor_opacidad) valor_opacidad.innerHTML = "0.5";
        if (rango_opacidad) rango_opacidad.value = 0.5;
        // restablecer estilo de capa
        capa_datos.eachLayer((layer) =>
          layer.setStyle({ weight: 2, opacity: 0.65, fillOpacity: 0.5 })
        );

      }

    });
  }

  // control de opacidad
  if (rango_opacidad && valor_opacidad) {

    // obtener valor de opacidad y actualizar en la capa
    rango_opacidad.addEventListener("input", () => {
      const newOpacity = parseFloat(rango_opacidad.value);
      valor_opacidad.innerHTML = newOpacity.toFixed(1);
      capa_datos.eachLayer((layer) =>
        layer.setStyle({ fillOpacity: newOpacity })
      );
    });

  }

  // guardar la capa para control futuro
  window[base] = capa_datos;

}

// -- iniciar puntos --
function graficar_puntos(data, base, activar, titulo) {

  let capa_datos_puntos = L.layerGroup();

  const checkbox = document.getElementById("capa_" + base);

  // icono personalizado
  var icono_personalizado = L.icon({
    iconUrl: "img/viaje-y-turismo.png",
    shadowUrl: "img/viaje-y-turismo.png",
    iconSize: [24, 24],
    shadowSize: [0, 0],
    iconAnchor: [12, 24],
    shadowAnchor: [0, 0],
    popupAnchor: [0, -24],
  });

  // primero limpiamos los puntos previos para actualizar sin duplicar
  capa_datos_puntos.clearLayers();

  // recorrido de atos
  data.forEach((item) => {

    // transformar a json
    const geojsonObj = JSON.parse(item.geojson);

    // crear capa con puntos
    const punto = L.geoJSON(geojsonObj, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {
          icon: icono_personalizado,
        });
      },
    });

    // asignar propiedad
    punto.db_polygono = 0;

    // agregar evento de apertura de modal con informacion
    punto.on("click", function () {

      // iniciar funcion de modal para visualizar informacion
      mostrar_info_modal(item,titulo);

    });

    // agregar el punto a la capa de puntos
    punto.addTo(capa_datos_puntos);

  });

  // control checkbox
  if (checkbox) {

    // evitar event listeners duplicados, clonar y reemplazar
    const newCheckbox = checkbox.cloneNode(true);
    checkbox.parentNode.replaceChild(newCheckbox, checkbox);

    // establecer evento de encendido de check
    newCheckbox.checked = activar;
    if (activar) {

      // agregar capa al mapa
      capa_datos_puntos.addTo(map);

    }

    // capturar evento de checkbox por capa
    newCheckbox.addEventListener("change", (e) => {

      // si checkbox esta en estado true
      if (e.target.checked) {

        // encender capa en el mapa
        map.addLayer(capa_datos_puntos);
        

      } 
      // si checkbox esta en estado false
      else {

        // descativar capa
        map.removeLayer(capa_datos_puntos);
        

      }

    });
  }

  

  // guardar la capa para control futuro
  window[base] = capa_datos_puntos;

}

// -- mostrar modal de informacion --
function mostrar_info_modal(item,titulo) {

  // titulo de modal
  $('.modal-title').html(titulo)

  // obtener elemento body de modal
  const modalBody = document.getElementById('modal-info-body');
  // variable de inicio de contenedor
  let contenido = '<div class="row">';

  // ciclo for de recorrido de propiedades
  for (const [clave, valor] of Object.entries(item)) {
    if (clave === 'geojson') continue; // saltar el geojson
    const label = clave.charAt(0).toUpperCase() + clave.slice(1).toLowerCase(); // formato Nombre, Codigo, etc.
    const esLargo = valor.length > 80; // si es muy largo, mostrar en una línea completa

    contenido += `
      <div class="col-md-${esLargo ? '12' : '6'} mb-2">
        <strong>${label}:</strong><br>${valor}
      </div>
    `;
  }
  // variable de finalizacion de contenedor
  contenido += '</div>';
  // agregar contenido al body del modal
  modalBody.innerHTML = contenido;

  // mostrar el modal
  const modal = new bootstrap.Modal(document.getElementById('modal-info'));
  modal.show();

}

// -- funcion para la limpieza de poligonos --
function clear_polygons(nivel) {
  var layers = map._layers;
  for (l in layers) {
    if (layers[l].db_polygono == nivel) {
      map.removeLayer(layers[l]);
    }
  }
}