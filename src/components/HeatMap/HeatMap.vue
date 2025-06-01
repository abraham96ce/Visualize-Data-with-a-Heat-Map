<template>
    <div>
        <h1 id="title">Monthly Global Land-Surface Temperature</h1>
        <p id="description">Monthly temperature variance from 1753 to 2015</p>
        <svg ref="svg" width="1200" height="500"></svg>
        <div id="tooltip" style="opacity: 0; position: absolute; background-color: white; border: 1px solid #ccc; padding: 8px; pointer-events: none;"></div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import drawHeatMap from './HeatMap'

// Referencia reactiva al elemento SVG donde se dibujará el mapa de calor
const svg = ref()

/**
 * Hook de ciclo de vida de Vue que se ejecuta cuando el componente
 * se monta en el DOM. Se llama a la función drawHeatMap pasándole
 * el elemento SVG referenciado para renderizar el gráfico.
 */
onMounted(async () => {
    await drawHeatMap(svg.value)
})
</script>
