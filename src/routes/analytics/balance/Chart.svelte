<script lang="ts">
  import { onMount, afterUpdate, onDestroy } from 'svelte';
  import type { ChartData, ChartOptions, Plugin, UpdateMode, ChartType, DefaultDataPoint } from 'chart.js';
  import { Chart as ChartJS, registerables } from 'chart.js';

  ChartJS.register(...registerables);

  interface ChartBaseProps<TType extends ChartType = ChartType, TData = DefaultDataPoint<TType>, TLabel = unknown> {
    /**
     * Chart.js chart type
     */
    type: TType;
    /**
     * The data object that is passed into the Chart.js chart
     * @see https://www.chartjs.org/docs/latest/getting-started/
     */
    data: ChartData<TType, TData, TLabel>;
    /**
     * The options object that is passed into the Chart.js chart
     * @see https://www.chartjs.org/docs/latest/general/options.html
     * @default {}
     */
    options?: ChartOptions<TType>;
    /**
     * The plugins array that is passed into the Chart.js chart
     * @see https://www.chartjs.org/docs/latest/developers/plugins.html
     * @default []
     */
    plugins?: Plugin<TType>[];
    /**
     * A mode string to indicate transition configuration should be used.
     * @see https://www.chartjs.org/docs/latest/developers/api.html#update-mode
     */
    updateMode?: UpdateMode;
  }

  interface $$Props<TType extends ChartType = ChartType, TData = DefaultDataPoint<TType>, TLabel = unknown>
    extends ChartBaseProps<TType, TData, TLabel> {
    chart?: ChartJS<TType, TData, TLabel> | null;
  }

  export let type: $$Props['type'];
  export let data: $$Props['data'] = { datasets: [] };
  export let options: $$Props['options'] = {};
  export let plugins: $$Props['plugins'] = [];
  export let updateMode: $$Props['updateMode'] = undefined;
  export let chart: $$Props['chart'] = null;
  let canvasRef: HTMLCanvasElement;

  onMount(() => {
    chart = new ChartJS(canvasRef, {
      type,
      data,
      options,
      plugins,
    });
  });

  afterUpdate(() => {
    if (!chart) return;

    chart.data = data;
    Object.assign(chart.options, options);
    chart.update(updateMode);
  });

  onDestroy(() => {
    if (chart) chart.destroy();
    chart = null;
  });
</script>

<canvas bind:this={canvasRef}></canvas>
