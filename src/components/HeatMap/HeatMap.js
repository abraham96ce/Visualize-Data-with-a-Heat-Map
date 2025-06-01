import * as d3 from 'd3'

/**
 * Función para dibujar un mapa de calor (heatmap) de variaciones de temperatura global
 * en un elemento SVG dado.
 * 
 * @param {SVGSVGElement} svgElement - Elemento SVG donde se renderizará el gráfico.
 */
export default async function drawHeatMap(svgElement) {
    // Definición de dimensiones y márgenes del gráfico
    const width = 1200
    const height = 500
    const padding = 100

    // Selección del elemento SVG usando D3
    const svgE1 = d3.select(svgElement)

    // Carga de datos JSON con las variaciones mensuales de temperatura global
    const data = await d3.json('https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json')
    const dataset = data.monthlyVariance

    // Extracción de valores únicos de años y definición de rango para meses (1-12)
    const years = dataset.map(d => d.year)
    const months = d3.range(1, 13)

    // Escala de banda para el eje X (años), con dominio en años únicos y rango en el ancho del SVG con padding
    const xScale = d3.scaleBand()
        .domain([...new Set(years)])
        .range([padding, width - padding])

    // Escala de banda para el eje Y (meses), con dominio de 1 a 12 y rango en la altura del SVG con padding
    const yScale = d3.scaleBand()
        .domain(months)
        .range([padding, height - padding])

    // Creación y renderizado del eje X con ticks cada 10 años, ubicado en la parte inferior del SVG
    svgE1.append('g')
        .attr('id', 'x-axis')
        .attr('transform', `translate(0, ${height - padding})`)
        .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter(y => y % 10 === 0)))

    // Creación y renderizado del eje Y con nombres de meses formateados, ubicado a la izquierda del SVG
    svgE1.append('g')
        .attr('id', 'y-axis')
        .attr('transform', `translate(${padding}, 0)`)
        .call(d3.axisLeft(yScale).tickFormat(m => d3.timeFormat('%B')(new Date(0, m - 1))))

    // Escala lineal de colores desde azul (frío) a rojo (caliente) según la variación de temperatura
    const colorScale = d3.scaleLinear()
        .domain(d3.extent(dataset, d => d.variance))
        .range(['blue', 'red'])

    // Selección del elemento tooltip para mostrar información al pasar el cursor
    const tooltip = d3.select('#tooltip')

    // Creación de las celdas (rectángulos) que representan cada dato mensual
    svgE1.selectAll('rect.cell')
        .data(dataset)
        .enter()
        .append('rect')
        .attr('class', 'cell')
        .attr('data-month', d => d.month - 1)
        .attr('data-year', d => d.year)
        .attr('data-temp', d => d.variance + data.baseTemperature)
        .attr('x', d => xScale(d.year))
        .attr('y', d => yScale(d.month))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(d.variance))
        .attr('stroke', 'none')
        // Evento mouseover para mostrar tooltip y resaltar celda
        .on('mouseover', (event, d) => {
            d3.select(event.currentTarget)
                .attr('stroke', 'black')
                .attr('stroke-width', 2)

            tooltip
                .style('opacity', 0.9)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px')
                .attr('data-year', d.year)
                .html(`
                    <strong>${d.year} - ${d3.timeFormat('%B')(new Date(0, d.month - 1))}</strong><br>
                    Temp: ${(data.baseTemperature + d.variance).toFixed(2)}℃<br>
                    Variance: ${d.variance.toFixed(2)}℃
                `)
        })
        // Evento mouseout para ocultar tooltip y remover resaltado
        .on('mouseout', (event) => {
            d3.select(event.currentTarget)
                .attr('stroke', 'none')

            tooltip.style('opacity', 0)
        })

    // Dimensiones y configuración de la leyenda de colores
    const legendWidth = 400
    const legendHeight = 30

    // Escala umbral para la leyenda, dividiendo el rango de variación en 8 segmentos con colores discretos
    const legendThreshold = d3.scaleThreshold()
        .domain((() => {
            const step = (d3.max(dataset, d => d.variance) - d3.min(dataset, d => d.variance)) / 8
            const range = d3.range(d3.min(dataset, d => d.variance), d3.max(dataset, d => d.variance), step)
            return range
        })())
        .range(d3.schemeRdYlBu[9].reverse()) // Paleta RdYlBu invertida para la leyenda

    // Escala lineal para posicionar los rectángulos de color en la leyenda
    const legendX = d3.scaleLinear()
        .domain(d3.extent(dataset, d => d.variance))
        .range([0, legendWidth])

    // Eje inferior para la leyenda que muestra valores numéricos de variación
    const legendAxis = d3.axisBottom(legendX)
        .tickSize(10)
        .tickFormat(d3.format(".2f"))
        .tickValues(legendThreshold.domain())

    // Grupo SVG para contener la leyenda, centrado horizontalmente y posicionado debajo del gráfico
    const legend = svgE1.append('g')
        .attr('id', 'legend')
        .attr('transform', `translate(${(width - legendWidth) / 2}, ${height - padding + 40})`)

    // Rectángulos de color para cada segmento de la leyenda
    legend.selectAll('rect')
        .data(legendThreshold.range().map(color => {
            const d = legendThreshold.invertExtent(color)
            if (!d[0]) d[0] = legendX.domain()[0]
            if (!d[1]) d[1] = legendX.domain()[1]
            return d
        }))
        .enter().append('rect')
        .attr('x', d => legendX(d[0]))
        .attr('y', 0)
        .attr('width', d => legendX(d[1]) - legendX(d[0]))
        .attr('height', legendHeight)
        .style('fill', d => legendThreshold(d[0]))

    // Añade el eje a la leyenda
    legend.append('g')
        .attr('transform', `translate(0, ${legendHeight})`)
        .call(legendAxis)
}
