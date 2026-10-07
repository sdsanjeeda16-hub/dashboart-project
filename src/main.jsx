import React, { useMemo, useReducer, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const subjects = ["Mathematics", "DBMS", "Operating Systems", "Java", "Data Structures"];

const initialStudents = Array.from({ length: 60 }, (_, i) => {
  const id = i + 1;
  const attendance = 62 + ((id * 7) % 37);
  return {
    id,
    rollNo: `DS${String(id).padStart(3, "0")}`,
    name: ["Aarav", "Sanjeeda", "Ananya", "Rahul", "Priya", "Vikram", "Meera", "Kiran"][i % 8] + ` ${["Kumar","Reddy","Sharma","Patel"][i % 4]}`,
    attendance,
    marks: {
      Mathematics: 55 + ((id * 11) % 43),
      DBMS: 50 + ((id * 13) % 48),
      "Operating Systems": 52 + ((id * 9) % 45),
      Java: 58 + ((id * 7) % 40),
      "Data Structures": 54 + ((id * 15) % 44)
    }
  };
});

function reducer(state, action) {
  switch (action.type) {
    case "updateMarks":
      return state.map(s => s.id === action.id
        ? { ...s, marks: { ...s.marks, [action.subject]: Number(action.value) } }
        : s);
    case "updateAttendance":
      return state.map(s => s.id === action.id ? { ...s, attendance: Number(action.value) } : s);
    case "addStudent":
      return [...state, action.student];
    case "replace":
      return action.students;
    default:
      return state;
  }
}

function App() {
  const [students, dispatch] = useReducer(reducer, initialStudents);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "rollNo", dir: "asc" });
  const [selectedId, setSelectedId] = useState(1);
  const [page, setPage] = useState("dashboard");
  const [subject, setSubject] = useState(subjects[0]);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const rows = students.filter(s =>
      !q || s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)
    );
    return [...rows].sort((a,b) => {
      const av = sort.key === "name" ? a.name : sort.key === "attendance" ? a.attendance : a.rollNo;
      const bv = sort.key === "name" ? b.name : sort.key === "attendance" ? b.attendance : b.rollNo;
      return (av > bv ? 1 : av < bv ? -1 : 0) * (sort.dir === "asc" ? 1 : -1);
    });
  }, [students, query, sort]);

  const selected = students.find(s => s.id === selectedId) || students[0];
  const avgAttendance = Math.round(students.reduce((a,s) => a + s.attendance, 0) / students.length);
  const below75 = students.filter(s => s.attendance < 75).length;
  const avgMark = Math.round(students.reduce((sum,s) => sum + Object.values(s.marks).reduce((a,b)=>a+b,0)/subjects.length,0)/students.length);

  function toggleSort(key) {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }));
  }

  function exportCSV() {
    const header = ["Roll No","Name","Attendance",...subjects];
    const rows = students.map(s => [s.rollNo,s.name,s.attendance,...subjects.map(x=>s.marks[x])]);
    const csv = [header,...rows].map(r => r.join(",")).join("\\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "deptboard-students.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function importCSV(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const lines = String(e.target.result).trim().split(/\\r?\\n/);
      if (lines.length < 2) return setNotice("CSV is empty.");
      const header = lines[0].split(",").map(x => x.trim());
      const required = ["Roll No","Name","Attendance"];
      if (!required.every(x => header.includes(x))) {
        return setNotice("Wrong CSV columns. Required: Roll No, Name, Attendance.");
      }
      const imported = lines.slice(1).map((line, idx) => {
        const cells = line.split(",").map(x => x.trim());
        const get = key => cells[header.indexOf(key)] ?? "";
        return {
          id: 1000 + idx,
          rollNo: get("Roll No") || `IMP${idx+1}`,
          name: get("Name") || "Imported Student",
          attendance: Number(get("Attendance")) || 0,
          marks: Object.fromEntries(subjects.map(sub => [sub, Number(get(sub)) || 0]))
        };
      });
      dispatch({type:"replace", students: imported});
      setNotice(`${imported.length} students imported successfully.`);
    };
    reader.readAsText(file);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo"><span>DB</span><div>DeptBoard<small>Attendance & Results</small></div></div>
        <div className="hod"><div className="avatar">H</div><div><b>Department HOD</b><small>Data Science</small></div></div>
        <nav>
          <button className={page==="dashboard"?"active":""} onClick={()=>setPage("dashboard")}>▦ <span>Dashboard</span></button>
          <button className={page==="students"?"active":""} onClick={()=>setPage("students")}>☷ <span>Students</span></button>
          <button className={page==="profile"?"active":""} onClick={()=>setPage("profile")}>◉ <span>Student Profile</span></button>
          <button className={page==="marks"?"active":""} onClick={()=>setPage("marks")}>✎ <span>Marks</span></button>
        </nav>
        <div className="sidebar-foot">● System online<br/><small>Last updated just now</small></div>
      </aside>

      <main className="content">
        <header className="top">
          <div><div className="crumb">DEPARTMENT / {page.toUpperCase()}</div><h1>{page==="dashboard"?"Attendance & Results Dashboard":page==="students"?"Student Directory":page==="profile"?"Student Profile":"Marks Management"}</h1><p>Monitor attendance and subject-wise performance at a glance.</p></div>
          <div className="top-actions">
            <label className="search">⌕ <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search students..." /></label>
            <button className="icon-btn">🔔</button>
            <button className="user-chip">HOD ▾</button>
          </div>
        </header>

        {notice && <div className="notice">{notice}<button onClick={()=>setNotice("")}>×</button></div>}

        {page==="dashboard" && <Dashboard students={students} avgAttendance={avgAttendance} below75={below75} avgMark={avgMark} setPage={setPage} />}
        {page==="students" && <Students rows={filtered} sort={sort} toggleSort={toggleSort} selectedId={selectedId} setSelectedId={setSelectedId} dispatch={dispatch} exportCSV={exportCSV} onImport={importCSV} setShowForm={setShowForm} />}
        {page==="profile" && <Profile student={selected} students={students} dispatch={dispatch} subject={subject} setSubject={setSubject} />}
        {page==="marks" && <Marks students={students} dispatch={dispatch} subject={subject} setSubject={setSubject} />}

        {showForm && <AddStudent close={()=>setShowForm(false)} dispatch={dispatch} />}
      </main>
    </div>
  );
}

function Dashboard({students, avgAttendance, below75, avgMark, setPage}) {
  const distribution = [0,0,0,0];
  students.forEach(s => s.attendance < 60 ? distribution[0]++ : s.attendance < 75 ? distribution[1]++ : s.attendance < 90 ? distribution[2]++ : distribution[3]++);
  return <div className="page">
    <section className="stats">
      <Stat label="TOTAL STUDENTS" value={students.length} icon="👥" tone="blue" note="+4 this month"/>
      <Stat label="AVG. ATTENDANCE" value={`${avgAttendance}%`} icon="◷" tone="green" note="Target: 75%"/>
      <Stat label="BELOW 75% ATTENDANCE" value={below75} icon="⚠" tone="orange" note="Needs attention"/>
      <Stat label="AVG. MARKS" value={`${avgMark}%`} icon="★" tone="purple" note="Across 5 subjects"/>
    </section>
    <div className="grid2">
      <section className="panel"><div className="panel-head"><div><h2>Attendance Distribution</h2><small>Number of students by attendance range</small></div><span className="tag">60 Students</span></div>
        <div className="bar-chart">{distribution.map((n,i)=><div className="chart-col" key={i}><strong>{n}</strong><div className="bar" style={{height:`${Math.max(8,n/Math.max(...distribution)*145)}px`}}></div><small>{["&lt;60%","60–74%","75–89%","90–100%"][i]}</small></div>)}</div>
      </section>
      <section className="panel"><div className="panel-head"><div><h2>Subject Averages</h2><small>Average marks by subject</small></div></div>
        {["Mathematics","DBMS","Operating Systems","Java","Data Structures"].map((sub,i)=>{const avg=Math.round(students.reduce((a,s)=>a+s.marks[sub],0)/students.length);return <div className="subject-row" key={sub}><span>{sub}</span><div className="line"><i style={{width:`${avg}%`}}/></div><b>{avg}%</b></div>})}
      </section>
    </div>
    <section className="panel"><div className="panel-head"><div><h2>Students Requiring Attention</h2><small>Attendance below 75%</small></div><button className="link-btn" onClick={()=>setPage("students")}>View all →</button></div>
      <table><thead><tr><th>ROLL NO</th><th>STUDENT</th><th>ATTENDANCE</th><th>AVERAGE MARKS</th><th>STATUS</th></tr></thead><tbody>
        {students.filter(s=>s.attendance<75).slice(0,6).map(s=><tr key={s.id}><td>{s.rollNo}</td><td><b>{s.name}</b></td><td><span className="danger">{s.attendance}%</span></td><td>{Math.round(Object.values(s.marks).reduce((a,b)=>a+b,0)/5)}%</td><td><span className="pill red">Low Attendance</span></td></tr>)}
      </tbody></table>
    </section>
  </div>
}

function Stat({label,value,icon,tone,note}) { return <div className="stat"><div className={`stat-icon ${tone}`}>{icon}</div><div><small>{label}</small><h2>{value}</h2><span>{note}</span></div></div> }

function Students({rows,sort,toggleSort,selectedId,setSelectedId,dispatch,exportCSV,onImport,setShowForm}) {
  return <div className="page"><section className="panel"><div className="toolbar"><div><h2>All Students</h2><small>{rows.length} students shown</small></div><div className="buttons"><label className="secondary">Import CSV<input type="file" accept=".csv" hidden onChange={e=>onImport(e.target.files[0])}/></label><button className="secondary" onClick={exportCSV}>Export CSV</button><button className="primary" onClick={()=>setShowForm(true)}>+ Add Student</button></div></div>
    <table><thead><tr>{[["rollNo","ROLL NO"],["name","STUDENT"],["attendance","ATTENDANCE"]].map(([k,l])=><th key={k} onClick={()=>toggleSort(k)} className="clickable">{l} {sort.key===k?(sort.dir==="asc"?"↑":"↓"):"↕"}</th>)}<th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>
      {rows.map(s=><tr key={s.id} className={s.id===selectedId?"selected":""}><td>{s.rollNo}</td><td><b>{s.name}</b></td><td><span className={s.attendance<75?"danger":"good"}>{s.attendance}%</span></td><td><span className={`pill ${s.attendance<75?"red":"green"}`}>{s.attendance<75?"Low":"Good"}</span></td><td><button className="small-btn" onClick={()=>setSelectedId(s.id)}>View</button><button className="small-btn" onClick={()=>dispatch({type:"updateAttendance",id:s.id,value:Math.min(100,s.attendance+1)})}>+1%</button></td></tr>)}
    </tbody></table>
  </section></div>
}

function Profile({student,students,dispatch,subject,setSubject}) {
  if(!student) return null;
  const avg=Math.round(Object.values(student.marks).reduce((a,b)=>a+b,0)/5);
  return <div className="page"><div className="profile-grid"><section className="panel profile-main"><div className="profile-banner"><div className="big-avatar">{student.name[0]}</div><div><span className="pill blue">DATA SCIENCE</span><h2>{student.name}</h2><p>{student.rollNo} · Year 2 · Section A</p></div><span className={`pill ${student.attendance<75?"red":"green"}`}>{student.attendance}% Attendance</span></div>
    <div className="profile-stats"><Stat label="ATTENDANCE" value={`${student.attendance}%`} icon="◷" tone="green" note="Target 75%"/><Stat label="AVG. MARKS" value={`${avg}%`} icon="★" tone="purple" note="5 subjects"/></div>
    <h3>Subject-wise Marks</h3>{subjects.map(s=><div className="mark-edit" key={s}><span>{s}</span><input type="number" min="0" max="100" value={student.marks[s]} onChange={e=>dispatch({type:"updateMarks",id:student.id,subject:s,value:e.target.value})}/><div className="line"><i style={{width:`${student.marks[s]}%`}}/></div></div>)}
  </section><section className="panel"><h2>Edit Attendance</h2><p className="muted">Update the selected student's attendance.</p><div className="attendance-big">{student.attendance}<small>%</small></div><input className="range" type="range" min="0" max="100" value={student.attendance} onChange={e=>dispatch({type:"updateAttendance",id:student.id,value:e.target.value})}/><div className="range-labels"><span>0%</span><span>75% target</span><span>100%</span></div><hr/><h3>Quick navigation</h3><select value={student.id} onChange={e=>{}}><option>{student.name}</option></select><p className="muted">Use the Students page to select another profile.</p></section></div></div>
}

function Marks({students,dispatch,subject,setSubject}) {
  return <div className="page"><section className="panel"><div className="toolbar"><div><h2>Marks Management</h2><small>Edit marks for any subject</small></div><select value={subject} onChange={e=>setSubject(e.target.value)}>{subjects.map(s=><option key={s}>{s}</option>)}</select></div><div className="marks-grid">{students.slice(0,20).map(s=><div className="marks-card" key={s.id}><div><b>{s.name}</b><small>{s.rollNo}</small></div><input type="number" min="0" max="100" value={s.marks[subject]} onChange={e=>dispatch({type:"updateMarks",id:s.id,subject,value:e.target.value})}/><span>/ 100</span></div>)}</div></section></div>
}

function AddStudent({close,dispatch}) {
  const [name,setName]=useState(""); const [rollNo,setRollNo]=useState(""); const [attendance,setAttendance]=useState(75);
  function save(e){e.preventDefault();if(!name.trim()||!rollNo.trim())return;dispatch({type:"addStudent",student:{id:Date.now(),name:name.trim(),rollNo:rollNo.trim(),attendance:Number(attendance),marks:Object.fromEntries(subjects.map(s=>[s,0]))}});close();}
  return <div className="modal"><form className="modal-box" onSubmit={save}><button type="button" className="close" onClick={close}>×</button><h2>Add Student</h2><label>Name<input value={name} onChange={e=>setName(e.target.value)} required/></label><label>Roll Number<input value={rollNo} onChange={e=>setRollNo(e.target.value)} required/></label><label>Attendance %<input type="number" min="0" max="100" value={attendance} onChange={e=>setAttendance(e.target.value)}/></label><button className="primary" type="submit">Add Student</button></form></div>
}

createRoot(document.getElementById("root")).render(<App />);
