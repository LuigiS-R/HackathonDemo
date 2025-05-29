// VIEW SWITCHING
function showView(id) {
  document.querySelectorAll('.view')
    .forEach(sec => sec.classList.toggle('hidden', sec.id !== id));
}

// Reset login form fields
function resetLoginForm() {
  document.getElementById('loginId').value = '';
  document.getElementById('loginPassword').value = '';
}

// “Go Back” buttons
document.querySelectorAll('.back').forEach(btn =>
  btn.addEventListener('click', () => showView('home'))
);

// Init navigation buttons
document.querySelectorAll('[data-view]').forEach(btn =>
  btn.addEventListener('click', () => showView(btn.dataset.view))
);

// Start on home
showView('home');


// DROP-ZONE UTILITY
function setupDropZone(z, i, l) {
  const zone = document.getElementById(z),
        inp  = document.getElementById(i),
        lst  = document.getElementById(l);

  function refresh() {
    lst.innerHTML = '';
    Array.from(inp.files).forEach(f => {
      const li = document.createElement('li');
      li.textContent = f.name;
      lst.appendChild(li);
    });
  }

  zone.addEventListener('dragover', e => { 
    e.preventDefault(); 
    one.classList.add('dragover');
  });
  zone.addEventListener('dragleave', () => {
    zone.classList.remove('dragover');
  });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    inp.files = e.dataTransfer.files;
    refresh();
  });
  inp.addEventListener('change', refresh);
}

['materials','template','answerKey','student']
.forEach(pref => setupDropZone(
  pref + 'Drop', 
  pref + 'Input', 
  pref + 'List'
));


// GENERATE → PREVIEW
document.getElementById('genExamBtn').onclick = () => {
  uploadGenerating();
  const counts = {
    truefalse: +document.getElementById('count-truefalse').value,
    multiple:  +document.getElementById('count-multiple').value,
    short:     +document.getElementById('count-short').value,
    numeric:   +document.getElementById('count-numeric').value,
  };
  const total = Object.values(counts).reduce((a,b)=>a+b, 0);
  const cont  = document.getElementById('questionsContainer');
  cont.innerHTML = '';
  for(let i=1; i<=total; i++){
    const d = document.createElement('div');
    d.className = 'question-line';
    d.draggable = true;
    d.innerHTML = `
      <span>${i}.</span>
      <span class="blank-line"></span>
      <button class="remove-btn">Remove</button>
    `;
    cont.appendChild(d);
  }
  showView('preview');
};

// REORDER & REMOVE
const cont = document.getElementById('questionsContainer');
let dragSrc = null;

cont.addEventListener('dragstart', e => {
  if (!e.target.classList.contains('question-line')) return;
  dragSrc = e.target; 
  e.target.classList.add('dragging');
});
cont.addEventListener('dragend', e =>{ 
  e.target.classList.remove('dragging');
});
cont.addEventListener('dragover', e => {
  e.preventDefault();
  const tgt = e.target.closest('.question-line');
  if (tgt && tgt !== dragSrc) {
    const { top, height } = tgt.getBoundingClientRect();
    const mid = top + height/2;
    cont.insertBefore(dragSrc, e.clientY < mid ? tgt : tgt.nextSibling);
    renumber();
  }
});
cont.addEventListener('click', e => {
  if (e.target.classList.contains('remove-btn')) {
    e.target.closest('.question-line').remove();
    renumber();
  }
});
function renumber(){
  Array.from(cont.children).forEach((ln,i) => {
    ln.querySelector('span').textContent = `${i+1}.`;
  });
}

// INSERT DIRECTLY & AI STUB
document.getElementById('insertDirect').onclick = () => {
  const q = document.getElementById('newQuestion').value.trim();
  if (!q) return alert('Enter a question.');
  const idx = cont.children.length + 1;
  const d = document.createElement('div');
  d.className = 'question-line'; d.draggable = true;
  d.draggable = true;
  d.innerHTML = `<span>${idx}.</span><span>${q}</span><button class="remove-btn">Remove</button>`;
  cont.appendChild(d);
  document.getElementById('newQuestion').value = '';
  renumber();
};
document.getElementById('insertAI').onclick =
  () => document.getElementById('insertDirect').click();

// Download Exam as PDF
document.getElementById('downloadExam').onclick = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  cont.querySelectorAll('.question-line').forEach((ln,i) => {
    const t = ln.querySelector('span:nth-child(2)').textContent || '';
    doc.text(`${i+1}. ${t}`, 10, 10 + i*10);
  });
  doc.save('exam_template.pdf');
};

// STUB ANSWER KEY
document.getElementById('downloadKey').onclick =
  () => alert('Answer key download not implemented');


// HAMBURGER MENU
const ham  = document.getElementById('hamburgerBtn'),
      side = document.getElementById('sideMenu');
ham.addEventListener('click', () => side.classList.toggle('open'));
side.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => side.classList.remove('open'))
);

// AUTH & MENU STATE
async function updateMenu(user){
  document.getElementById('menuUser').textContent    = user ? user.name : 'Guest';
  document.getElementById('menuLogin').classList.toggle('hidden', !!user);
  document.getElementById('menuSignup').classList.toggle('hidden', !!user);
  document.getElementById('menuLogout').classList.toggle('hidden', !user);
  document.getElementById('logoutLink').classList.toggle('hidden', !user);
  // show personal & gradebook only when logged in
  document.querySelectorAll('.menu-link').forEach(el =>
    el.classList.toggle('hidden', !user)
  );
}
async function checkAuth(){
  const res     = await fetch('/auth-status'),
        { user } = await res.json();
  updateMenu(user);
}
window.addEventListener('load', checkAuth);


// LOGIN & SIGNUP
document.getElementById('menuLogin').onclick = e => {
  e.preventDefault();
  resetLoginForm();
  showView('login');
};
document.getElementById('toSignup').onclick = e => {
  e.preventDefault();
  resetLoginForm();
  showView('signup');
};
document.getElementById('menuSignup').onclick = e => {
  e.preventDefault();
  resetLoginForm();
  showView('signup');
};

document.getElementById('loginBtn').onclick = async () => {
  const id = document.getElementById('loginId').value.trim(),
        pw = document.getElementById('loginPassword').value;
  const res = await fetch('http://localhost:3000/login', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({id: id, password: pw })
  });
  if (res == "Not found"){
    //Handle logic
  }
};

document.getElementById('signupBtn').onclick = async () => {
  const payload = {
    id:      document.getElementById('signupId').value.trim(),
    name:    document.getElementById('signupName').value.trim(),
    email:   document.getElementById('signupEmail').value.trim(),
    password:document.getElementById('signupPassword').value,
    confirm: document.getElementById('signupConfirm').value
  };

  fetch("http://localhost:3000/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({id: payload.id, name: payload.name, email: payload.email, password: payload.password})
  })
  .then(res => res.text())
  .then(data => console.log(data));
};

// LOGOUT (same handler for header & menu)
document.getElementById('logoutLink').onclick =
document.getElementById('menuLogout').onclick = async () => {
  await fetch('/logout');
  await checkAuth();
  resetLoginForm();
  showView('login');
};


async function loadGradebook() {
  const res = await fetch('/scores');
  if (!res.ok) return alert('Please log in first');
  const grades = await res.json();

  const tbody = document.querySelector('#gradebookTable tbody');
  tbody.innerHTML = grades.map(g => `
    <tr>
      <td>${g.date.split('T')[0]}</td>
      <td>${g.examName || 'Exam'}</td>
      <td>${g.studentId}</td>
      <td>${g.studentName}</td>
      <td>${g.score}</td>
    </tr>
  `).join('');
}

// Hook Gradebook menu link
document.querySelector('[data-view="previous"]').addEventListener('click', () => {
  showView('previous');
  loadGradebook();
});


// BATCH GRADING (AI)
document.getElementById('gradeBatchBtn').onclick = async () => {
  console.log("Hello");
  uploadGrading();
  /*const tpl  = document.getElementById('templateInput').files[0];
  const key  = document.getElementById('answerKeyInput').files[0];
  const subs = Array.from(document.getElementById('studentInput').files);
  if (!tpl || !key || !subs.length) {
    return alert('Please upload template, answer key and student papers.');
  }

  // show spinner
  document.getElementById('spinner').classList.remove('hidden');

  const form = new FormData();
  form.append('template', tpl);
  form.append('answerKey', key);
  subs.forEach(f => form.append('studentPapers', f));

  const res = await fetch('/grade-batch', { method:'POST', body:form });

  // hide spinner
  document.getElementById('spinner').classList.add('hidden');

  if (!res.ok) {
    alert('Batch grading error: ' + (await res.json()).error);
    return;
  }
  const results = await res.json();
  const tbody   = document.querySelector('#batchResults tbody');
  tbody.innerHTML = results.map(r =>
    `<tr>
      <td>${r.studentId}</td>
      <td>${r.studentName}</td>
      <td>${r.score}</td>
      <td><a href="${r.paperUrl}" download>Download</a></td>
    </tr>`
  ).join('');
  document.getElementById('resultsSection').classList.remove('hidden');*/
};


//My own functions
function uploadGrading(){
  console.log("Hello");
  const answerKeyInput = document.getElementById("answerKeyInput");
  const answerKey = answerKeyInput.files;

  const examPaperInput = document.getElementById("studentInput");
  const examPapers = examPaperInput.files;

  const akformData = new FormData();
  akformData.append("answerKey", answerKey[0]);

  const epformData = new FormData();
  for(let i = 0; i<examPapers.length; i++){
    epformData.append("examPapers", examPapers[i]);
  }

  fetch('/answerKey/upload', {
    method: 'POST',
    body: akformData
  })
  .then(res => {
    if (!res.ok) throw new Error("Upload failed");
  })
  .catch(err => {
    console.error("Upload error:", err.message);
  })

  fetch('/examPapers/upload', {
    method: 'POST',
    body: epformData
  })
  .then(res => {
    if (!res.ok) throw new Error("Upload failed");
  })
  .catch(err => {
    console.error("Upload error:", err.message);
  })
}



//My own functions
function uploadGenerating(){
  const lectureMaterialsInput = document.getElementById("materialsInput");
  const lectureMaterials = lectureMaterialsInput.files;

  const formData = new FormData();
  for(let i = 0; i<lectureMaterials.length; i++){
    formData.append('lectureMaterials', lectureMaterials[i]);
  }

  fetch('/lectureMaterials/upload', {
    method: 'POST',
    body: formData
  })
  .then(res => {
    if (!res.ok) throw new Error("Upload failed");
  })
  .catch(err => {
    console.error("Upload error:", err.message);
  })
}

// My own functions 2.0
function uploadGenerating() {
  const lectureMaterialsInput = document.getElementById("materialsInput");
  const lectureMaterials = lectureMaterialsInput.files;

  if (!lectureMaterials.length) {
    alert("Please upload lecture material PDFs first.");
    return;
  }

  const formData = new FormData();
  for (let i = 0; i < lectureMaterials.length; i++) {
    formData.append('lectureMaterials', lectureMaterials[i]);
  }

  fetch('/lectureMaterials/upload', {
    method: 'POST',
    body: formData
  })
  .then(res => {
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  })
  .then(data => {
    console.log("Lecture materials uploaded successfully.");

    const question_settings = {
      1: {
        mcq: parseInt(document.getElementById('count-multiple').value),
        tf: parseInt(document.getElementById('count-truefalse').value),
        sa: parseInt(document.getElementById('count-short').value),
        num: parseInt(document.getElementById('count-numeric').value),
      }
    };

    return fetch('/generateExam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        detail_level: 'short',
        question_settings
      })
    });
  })
  .then(res => {
    if (!res.ok) throw new Error("Exam generation failed");
    return res.json();
  })
  .then(generatedExam => {
    console.log("Generated Exam:", generatedExam);

    const container = document.getElementById("examOutput");
    container.innerHTML = "<pre>" + JSON.stringify(generatedExam, null, 2) + "</pre>";

    // Optional: populate into preview container dynamically
  })
  .catch(err => {
    console.error("Error during exam generation:", err.message);
    alert("Something went wrong: " + err.message);
  });
}
