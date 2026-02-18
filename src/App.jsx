import React, { useEffect, useState } from "react";
import "./App.css";

const BASE_URL =
  "https://botfilter-h5ddh6dye8exb7ha.centralus-01.azurewebsites.net";
const USER_EMAIL = "pedritorcivia@gmail.com";

function App() {
  const [candidate, setCandidate] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");

      try {
        const [candidateRes, jobsRes] = await Promise.all([
          fetch(
            `${BASE_URL}/api/candidate/get-by-email?email=${encodeURIComponent(
              USER_EMAIL
            )}`
          ),
          fetch(`${BASE_URL}/api/jobs/get-list`),
        ]);

        if (!candidateRes.ok) {
          throw new Error(`Candidate GET failed: ${candidateRes.status}`);
        }
        if (!jobsRes.ok) {
          throw new Error(`Jobs GET failed: ${jobsRes.status}`);
        }

        const candidateData = await candidateRes.json();
        const jobsData = await jobsRes.json();

        // Debug: mirá en consola la forma real de la respuesta
        console.log("jobsData raw:", jobsData);

        // Normalización: soporta array directo, $values, value, data, jobs
        const jobsList =
          (Array.isArray(jobsData) && jobsData) ||
          jobsData?.$values ||
          jobsData?.value ||
          jobsData?.data ||
          jobsData?.jobs ||
          [];

        setCandidate(candidateData);
        setJobs(Array.isArray(jobsList) ? jobsList : []);
      } catch (e) {
        console.error(e);
        setError(
          "No se pudo cargar la información. Revisá consola / Network para ver el detalle."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div className="status">Cargando...</div>;

  if (error) {
    return (
      <div className="status error">
        <div className="status-title">Error</div>
        <div className="status-text">{error}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container wide">
        {/* STEP 2 */}
        <div className="card">
          <span className="step-label">Step 2: Datos de Candidato</span>
          <h1>
            {candidate?.firstName} {candidate?.lastName}
          </h1>

          <div className="data-group">
            <div className="data-row">
              <span className="label">Email de contacto</span>
              <span className="value">{candidate?.email}</span>
            </div>

            <div className="data-row">
              <span className="label">Candidate ID</span>
              <span className="value">{candidate?.candidateId}</span>
            </div>

            <div className="data-row">
              <span className="label">Application ID</span>
              <span className="value">{candidate?.applicationId}</span>
            </div>

            <div className="data-row">
              <span className="label">UUID de Sesión</span>
              <span className="value">{candidate?.uuid}</span>
            </div>
          </div>
        </div>

        {/* STEP 3 */}
        <div className="card">
          <span className="step-label">Step 3: Posiciones abiertas</span>
          <h2>Jobs disponibles</h2>

          {jobs.length === 0 ? (
            <div className="empty">
              No hay posiciones para mostrar (o la API devolvió una estructura
              distinta).
              <br />
              Revisá consola: <span className="mono">jobsData raw</span>.
            </div>
          ) : (
            <div className="table">
              <div className="table-head">
                <div>ID</div>
                <div>Título</div>
              </div>

              {jobs.map((job) => {
                // por las dudas el id venga con otro nombre
                const id = job?.id ?? job?.jobId ?? job?.jobID ?? job?.Id;
                const title = job?.title ?? job?.name ?? job?.Title;

                return (
                  <div className="table-row" key={String(id ?? title)}>
                    <div className="mono">{id}</div>
                    <div>{title}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
