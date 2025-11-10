import { useEffect, useRef } from "react";
import * as d3 from "d3";

// nodes: [{ id, type: 'circle'|'square'|'triangle', x, y, size, label }]
// edges: [{ source: id, target: id }]
function Canvas({
  width = 700,
  height = 200,
  nodes = [],
  edges = [],
  onNodesChange,
}) {
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const dragState = useRef(null); // { node, offsetX, offsetY }

  // Map prop nodes/edges to simulation objects and (re)start simulation
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    // Build or update nodes preserving positions
    const byId = new Map(nodesRef.current.map((n) => [n.id, n]));
    const simNodes = nodes.map((n) => {
      const prev = byId.get(n.id);
      const size = n.size ?? 28;
      if (prev) {
        prev.size = size;
        prev.label = n.label;
        prev.type = n.type;
        // If prev has no position yet, initialize from prop
        prev.x = prev.x ?? n.x ?? width / 2;
        prev.y = prev.y ?? n.y ?? height / 2;
        return prev;
      }
      return {
        id: n.id,
        type: n.type,
        size,
        label: n.label,
        x: n.x ?? width / 2,
        y: n.y ?? height / 2,
      };
    });
    nodesRef.current = simNodes;

    // Build links referencing node objects
    const idMap = new Map(simNodes.map((n) => [n.id, n]));
    linksRef.current = edges
      .map((e) => ({
        source: idMap.get(e.source),
        target: idMap.get(e.target),
      }))
      .filter((l) => l.source && l.target);

    // Init or update simulation
    if (!simRef.current) {
      simRef.current = d3
        .forceSimulation(simNodes)
        .force(
          "link",
          d3
            .forceLink(linksRef.current)
            .id((d) => d.id)
            .distance(
              (l) => ((l.source.size ?? 28) + (l.target.size ?? 28)) * 0.9
            )
            .strength(0.12)
        )
        .force("charge", d3.forceManyBody().strength(-200))
        .force(
          "collide",
          d3.forceCollide().radius((d) => (d.size ?? 28) * 0.6 + 8)
        )
        .force("center", d3.forceCenter(width / 2, height / 2))
        .alpha(0.8)
        .alphaDecay(0.05)
        .on("tick", () => draw());
    } else {
      simRef.current.nodes(simNodes);
      simRef.current.force("link").links(linksRef.current);
      simRef.current.force("center", d3.forceCenter(width / 2, height / 2));
      simRef.current.alpha(0.8).restart();
    }

    const draw = () => {
      const ctx = el.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      el.width = Math.floor(width * dpr);
      el.height = Math.floor(height * dpr);
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(1, "#f8fafc");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // title
      ctx.fillStyle = "#0f172a";
      ctx.font =
        "600 16px ui-sans-serif, system-ui, Segoe UI, Roboto, Helvetica, Arial";
      ctx.textAlign = "left";
      ctx.fillText("Canvas Nodes", 12, 24);

      // edges
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1.5;
      linksRef.current.forEach((l) => {
        ctx.beginPath();
        ctx.moveTo(l.source.x, l.source.y);
        ctx.lineTo(l.target.x, l.target.y);
        ctx.stroke();
      });

      // nodes
      nodesRef.current.forEach((n) => {
        const size = n.size ?? 28;
        const color =
          n.type === "circle"
            ? "#2563eb"
            : n.type === "square"
            ? "#10b981"
            : "#f59e0b";
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = "#0f172a22";
        ctx.lineWidth = 2;
        if (n.type === "circle") {
          ctx.beginPath();
          ctx.arc(n.x, n.y, size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (n.type === "square") {
          ctx.beginPath();
          ctx.rect(n.x - size / 2, n.y - size / 2, size, size);
          ctx.fill();
          ctx.stroke();
        } else if (n.type === "triangle") {
          const h = (Math.sqrt(3) / 2) * size;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y - (2 / 3) * h);
          ctx.lineTo(n.x - size / 2, n.y + (1 / 3) * h);
          ctx.lineTo(n.x + size / 2, n.y + (1 / 3) * h);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        if (n.label) {
          ctx.fillStyle = "#334155";
          ctx.font =
            "12px ui-sans-serif, system-ui, Segoe UI, Roboto, Helvetica, Arial";
          ctx.textAlign = "center";
          ctx.fillText(n.label, n.x, n.y + size);
        }
        ctx.restore();
      });

      if (!nodesRef.current.length) {
        ctx.fillStyle = "#64748b";
        ctx.font =
          "14px ui-sans-serif, system-ui, Segoe UI, Roboto, Helvetica, Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "No nodes selected. Submit a person ID, then toggle repos/teams →",
          width / 2,
          height / 2
        );
      }
    };

    // initial draw before ticks start
    draw();

    return () => {
      // leave simulation running; it will be updated by next effect
    };
  }, [nodes, edges, width, height]);

  // Drag interaction: use simulation's fixed positions fx/fy
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const sim = simRef.current;
    if (!sim) return;

    const getPos = (evt) => {
      const rect = el.getBoundingClientRect();
      return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    };

    const pickNode = (x, y) => {
      for (let i = nodesRef.current.length - 1; i >= 0; i--) {
        const n = nodesRef.current[i];
        const r = (n.size ?? 28) / 2;
        const dx = x - n.x;
        const dy = y - n.y;
        if (dx * dx + dy * dy <= r * r) return n;
      }
      return null;
    };

    const onDown = (e) => {
      const { x, y } = getPos(e);
      const n = pickNode(x, y);
      if (n) {
        dragState.current = { node: n, offsetX: x - n.x, offsetY: y - n.y };
        n.fx = n.x;
        n.fy = n.y;
        el.style.cursor = "grabbing";
        sim.alphaTarget(0.3).restart();
      }
    };

    const onMove = (e) => {
      const ds = dragState.current;
      if (!ds) return;
      const { x, y } = getPos(e);
      ds.node.fx = x - ds.offsetX;
      ds.node.fy = y - ds.offsetY;
    };

    const onUp = () => {
      const ds = dragState.current;
      if (!ds) return;
      ds.node.fx = null;
      ds.node.fy = null;
      dragState.current = null;
      el.style.cursor = "default";
      sim.alphaTarget(0);
      // notify parent of final positions
      onNodesChange?.(
        nodesRef.current.map(({ id, type, x, y, size, label }) => ({
          id,
          type,
          x,
          y,
          size,
          label,
        }))
      );
    };

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onNodesChange]);

  return <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />;
}

export default Canvas;
