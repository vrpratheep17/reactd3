import { useEffect, useRef, useState } from "react";

import "./App.css";
import Sidebar from "./components/Sidebar.jsx";
import Canvas from "./components/Canvas.jsx";
import { getPerson, getReposByPerson, getTeamsByPerson } from "./data/api.js";

function App() {
  const [form, setForm] = useState({ personId: "", type: "person" });
  const [toggles, setToggles] = useState({ teams: false, repos: false });
  const [person, setPerson] = useState(null);
  const [nodes, setNodes] = useState([]); // for Canvas
  const [edges, setEdges] = useState([]);
  const rightRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(1020);
  const [canvasHeight, setCanvasHeight] = useState(800);

  const handleSubmit = async () => {
    const id = form.personId.trim();
    if (!id) return;
    try {
      const p = await getPerson(id);
      setPerson(p);
      // center node
      const cx = canvasWidth / 2;
      const cy = canvasHeight / 2;
      const center = { id: p.id, type: "circle", x: cx, y: cy, size: 60, label: p.name };
      setNodes([center]);
      setEdges([]);
    } catch (e) {
      console.error(e);
    }
  };

  // Apply repo/team toggles by fetching and laying out nodes around center
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!person) return;
      // preserve current center if exists
      const center = nodes.find((n) => n.id === person.id) || {
        id: person.id,
        type: "circle",
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        size: 60,
        label: person.name,
      };

      const rings = [];
      if (toggles.repos) {
        const repos = await getReposByPerson(person.id);
        rings.push({ items: repos.map((r) => ({ id: r.id, label: r.name })), shape: "square", radius: 120 });
      }
      if (toggles.teams) {
        const teams = await getTeamsByPerson(person.id);
        rings.push({ items: teams.map((t) => ({ id: t.id, label: t.name })), shape: "triangle", radius: 180 });
      }

      const nextNodes = [center];
      const nextEdges = [];
      rings.forEach(({ items, shape, radius }) => {
        const n = items.length;
        if (n === 0) return;
        const theta0 = -Math.PI / 2;
        items.forEach((it, idx) => {
          const theta = theta0 + (idx * 2 * Math.PI) / n;
          const x = center.x + radius * Math.cos(theta);
          const y = center.y + radius * Math.sin(theta);
          // preserve position if node already exists
          const existing = nodes.find((nn) => nn.id === it.id);
          nextNodes.push({ id: it.id, type: shape, x: existing?.x ?? x, y: existing?.y ?? y, size: 36, label: it.label });
          nextEdges.push({ source: center.id, target: it.id });
        });
      });

      if (!cancelled) {
        setNodes(nextNodes);
        setEdges(nextEdges);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [toggles, person, canvasWidth, canvasHeight]);

  // Measure the right pane for exact sizing (full width/height)
  useEffect(() => {
    const el = rightRef.current;
    if (!el) return;
    const measure = () => {
      setCanvasWidth(Math.floor(el.clientWidth));
      setCanvasHeight(Math.floor(el.clientHeight));
    };
    // Defer initial measure to ensure layout is settled
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div className="fixed inset-0 h-dvh flex overflow-hidden bg-gray-50 text-gray-900 dark:bg-neutral-900 dark:text-neutral-100">
      <Sidebar
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        toggles={toggles}
        setToggles={setToggles}
        hasItems={!!person}
      />
      <section ref={rightRef} className="flex-1 min-h-0 min-w-0 h-dvh p-0 overflow-hidden">
        <div ref={canvasContainerRef} className="relative w-full h-full">
          <Canvas
            width={canvasWidth}
            height={canvasHeight}
            nodes={nodes}
            edges={edges}
            onNodesChange={setNodes}
          />
        </div>
      </section>
    </div>
  );
}

export default App;
