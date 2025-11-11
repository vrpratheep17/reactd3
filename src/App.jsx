import { useEffect, useRef, useState } from "react";

import "./App.css";
import Sidebar from "./components/Sidebar.jsx";
import Canvas from "./components/Canvas.jsx";
import { getPerson, getTeamsWithReposByPerson } from "./data/api.js";

function App() {
  const [form, setForm] = useState({ personId: "", type: "person" });
  const [toggles, setToggles] = useState({ teamMembers: false, repos: false });
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

      const nextNodes = [center];
      const nextEdges = [];

      if (toggles.teamMembers) {
        // Fetch teams with repos and lay out hierarchically
        const teams = await getTeamsWithReposByPerson(person.id);
        const nTeams = teams.length || 1;
        const teamRadius = Math.min(canvasWidth, canvasHeight) * 0.28; // ring around center
        const theta0 = -Math.PI / 2;
        const teamPos = new Map();

        teams.forEach((t, idx) => {
          const theta = theta0 + (idx * 2 * Math.PI) / nTeams;
          const x = center.x + teamRadius * Math.cos(theta);
          const y = center.y + teamRadius * Math.sin(theta);
          const existing = nodes.find((nn) => nn.id === t.id);
          const tx = existing?.x ?? x;
          const ty = existing?.y ?? y;
          nextNodes.push({ id: t.id, type: "triangle", x: tx, y: ty, size: 36, label: t.name });
          nextEdges.push({ source: center.id, target: t.id });
          teamPos.set(t.id, { x: tx, y: ty, repos: t.repos || [] });
        });

        if (toggles.repos) {
          const seenRepo = new Set();
          // place repos around each team in a small local ring
          for (const [tid, info] of teamPos.entries()) {
            const repos = info.repos;
            const m = repos.length || 1;
            const rRadius = 90; // around team node
            const start = -Math.PI / 2;
            repos.forEach((r, i) => {
              const ang = start + (i * 2 * Math.PI) / m;
              const rx = info.x + rRadius * Math.cos(ang);
              const ry = info.y + rRadius * Math.sin(ang);
              const existing = nodes.find((nn) => nn.id === r.id);
              if (!seenRepo.has(r.id)) {
                nextNodes.push({ id: r.id, type: "square", x: existing?.x ?? rx, y: existing?.y ?? ry, size: 28, label: r.name });
                seenRepo.add(r.id);
              }
              nextEdges.push({ source: tid, target: r.id });
            });
          }
        }
      }

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
