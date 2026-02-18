import React, { useEffect, useState } from "react";
import "./App.css";

const BASE_URL =
  "https://botfilter-h5ddh6dye8exb7ha.centralus-01.azurewebsites.net";
const USER_EMAIL = "pedritorcivia@gmail.com";

const APPLY_ENDPOINT = "/api/candidate/apply-to-job";

function normalizeJobs(jobsData) {
  // Soporta array directo y wrappers comunes
  const jobsList =
    (Array.isArray(jobsData) && jobsData) ||
    jobsData?.$values ||
    jobsData?.value ||
    jobsData?.data ||
    jobsData?.jobs ||
    [];

  return Array.isArray(jobsList) ? jobsList : [];
}

function isValidGithubRepoUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return false;
    const parts = u.pathname.split("/").filter(Boolean);
    return parts.length >= 2; // github.com/user/repo
  } catch {
    return false;
  }
}

export default function App() {
  const [candidate, setCandidate] = useState(null);
  const [jobs, setJobs] = useState([]);

  // Step 4: input por job
  const [repoUrlsByJobId, setRepoUrlsByJobId] = useState({});
  const [submittingByJobId, setSubmittingByJobId] = useState({});
  const [resultByJobId, setResultByJobId] = useState({}); // { [jobId]: { ok, message } }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canSubmit = !!candidate?.uuid && !!candidate?.candidateId;

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

        setCandidate(candidateData);
        setJobs(normalizeJobs(jobsData));
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

  function updateRepoUrl(jobId, value) {
    setRepoUrlsByJobId((prev) => ({ ...prev, [jobId]: value }));
  }

  async function applyToJob(job) {
    const jobId = String(job?.id ?? "");
    const title = String(job?.title ?? "");

    if (!jobId) {
      setResultByJobId((prev) => ({
        ...prev,
        [jobId || title]: { ok: false, message: "No se encontró el ID del job." },
      }));
      return;
    }

    if (!canSubmit) {
      setResultByJobId((prev) => ({
        ...prev,
        [jobId]: {
          ok: false,
          message: "Faltan datos del candidato (uuid / candidateId).",
        },
      }));
      return;
    }

    const repoUrl = (repoUrlsByJobId[jobId] || "").trim();

    if (!repoUrl) {
      setResultByJobId((prev) => ({
        ...prev,
        [jobId]: { ok: false, message: "Ingresá la URL del repo de GitHub." },
      }));
      return;
    }

    if (!isValidGithubRepoUrl(repoUrl)) {
      setResultByJobId((prev) => ({
        ...prev,
        [jobId]: {
          ok: false,
          message: "URL inválida. Usá formato github.com/usuario/repo.",
        },
      }));
      return;
    }

    setSubmittingByJobId((prev) => ({ ...prev, [jobId]: true }));
    setResultByJobId((prev) => ({ ...prev, [jobId]: null }));

    const body = {
      uuid: candidate.uuid,
      jobId,
      candidateId: candidate.candidateId,
      applicationId: candidate.applicationId, 
      repoUrl,
    };

    try {
      const res = await fetch(`${BASE_URL}${APPLY_ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const raw = await res.text();
      let parsed = raw;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch {
        // queda como texto
      }

      if (!res.ok) {
        const detail =
          typeof parsed === "string"
            ? parsed
            : JSON.stringify(parsed ?? {}, null, 2);

        setResultByJobId((prev) => ({
          ...prev,
          [jobId]: {
            ok: false,
            message: `Falló el submit (HTTP ${res.status}). ${detail}`,
          },
        }));
        return;
      }

      // Éxito esperado: { "ok": true }
      const ok = parsed?.ok === true || raw.includes('"ok":true');

      setResultByJobId((prev) => ({
        ...prev,
        [jobId]: {
          ok: ok,
          message: ok
            ? `Postulación enviada para "${title}".`
            : `Respuesta OK pero inesperada: ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`,
        },
      }));
    } catch (e) {
      console.error(e);
      setResultByJobId((prev) => ({
        ...prev,
        [jobId]: { ok: false, message: "Error de red al enviar la postulación." },
      }));
    } finally {
      setSubmittingByJobId((prev) => ({ ...prev, [jobId]: false }));
    }
  }

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
              <span className="label">Email</span>
              <span className="value">{candidate?.email}</span>
            </div>

            <div className="data-row">
              <span className="label">Candidate ID</span>
              <span className="value">{candidate?.candidateId}</span>
            </div>

            <div className="data-row">
              <span className="label">UUID</span>
              <span className="value">{candidate?.uuid}</span>
            </div>
          </div>

          {!canSubmit && (
            <div className="alert error">
              Faltan datos para enviar la postulación (uuid / candidateId).
            </div>
          )}
        </div>

        {/* STEP 4 */}
        <div className="card">
          <span className="step-label">Step 4: Listado de posiciones</span>
          <h2>Posiciones abiertas</h2>

          {jobs.length === 0 ? (
            <div className="empty">No hay posiciones para mostrar.</div>
          ) : (
            <div className="jobs">
              {jobs.map((job) => {
                const jobId = String(job?.id ?? "");
                const title = String(job?.title ?? "");
                const repoUrl = repoUrlsByJobId[jobId] || "";
                const submitting = !!submittingByJobId[jobId];
                const result = resultByJobId[jobId];

                return (
                  <div className="job-item" key={jobId}>
                    <div className="job-header">
                      <div className="job-title">{title}</div>
                      <div className="job-id">ID: {jobId}</div>
                    </div>

                    <label className="input-label">
                      URL de tu repo de GitHub
                      <input
                        className="input"
                        placeholder="https://github.com/tu-usuario/tu-repo"
                        value={repoUrl}
                        onChange={(e) => updateRepoUrl(jobId, e.target.value)}
                      />
                    </label>

                    <button
                      className="btn"
                      type="button"
                      onClick={() => applyToJob(job)}
                      disabled={submitting}
                    >
                      {submitting ? "Enviando..." : "Submit"}
                    </button>

                    {result && (
                      <div className={`alert ${result.ok ? "ok" : "error"}`}>
                        {result.message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="hint">
            POST: <span className="mono">{APPLY_ENDPOINT}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
