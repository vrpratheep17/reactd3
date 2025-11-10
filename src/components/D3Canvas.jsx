import { useEffect, useRef } from "react";
import * as d3 from "d3";

// data: [{ label: string, value: number }]
function D3Canvas({ data = [] }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // clear
    ctx.clearRect(0, 0, width, height);

    // padding for axes/labels
    const margin = { top: 24, right: 16, bottom: 40, left: 36 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    // background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#e5e7eb"; // gray-200
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

    const labels = data.map((d) => d.label);
    const maxVal = d3.max(data, (d) => d.value) || 1;

    const x = d3.scaleBand().domain(labels).range([0, innerW]).padding(0.2);
    const y = d3.scaleLinear().domain([0, maxVal]).nice().range([innerH, 0]);

    // draw bars
    ctx.save();
    ctx.translate(margin.left, margin.top);

    for (const d of data) {
      const bx = x(d.label);
      if (bx == null) continue;
      const bh = innerH - y(d.value);
      const by = y(d.value);
      const bw = x.bandwidth();

      ctx.fillStyle = "#2563eb"; // blue-600
      ctx.fillRect(bx, by, bw, bh);

      // value label
      ctx.fillStyle = "#111827"; // gray-900
      ctx.font =
        "12px ui-sans-serif, system-ui, Segoe UI, Roboto, Helvetica, Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(String(d.value), bx + bw / 2, by - 4);
    }

    // x-axis labels
    ctx.fillStyle = "#374151"; // gray-700
    ctx.font =
      "12px ui-sans-serif, system-ui, Segoe UI, Roboto, Helvetica, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const label of labels) {
      const bx = x(label);
      if (bx == null) continue;
      ctx.fillText(label, bx + x.bandwidth() / 2, innerH + 8);
    }

    // y-axis line
    ctx.strokeStyle = "#e5e7eb";
    ctx.beginPath();
    ctx.moveTo(0.5, 0.5);
    ctx.lineTo(0.5, innerH + 0.5);
    ctx.stroke();

    ctx.restore();
  }, [width, height, data]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full rounded border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
    />
  );
}

export default D3Canvas;
