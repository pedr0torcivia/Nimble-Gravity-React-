import React, { useState, useEffect } from 'react';
import './App.css';

const BASE_URL = 'https://botfilter-h5ddh6dye8exb7ha.centralus-01.azurewebsites.net';
const USER_EMAIL = 'pedritorcivia@gmail.com'; 

function App() {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${BASE_URL}/api/candidate/get-by-email?email=${USER_EMAIL}`);
        const data = await res.json();
        setCandidate(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="container">
      <div className="card">
        <span className="step-label">Step 2: Datos de Candidato</span>
        <h1>{candidate?.firstName} {candidate?.lastName}</h1>
        
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
            <span className="label">UUID de Sesión</span>
            <span className="value">{candidate?.uuid}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;