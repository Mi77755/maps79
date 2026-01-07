window.onload = () => {
  const popup = document.getElementById("popup");
  const popupTitle = document.getElementById("popup-title");
  const popupDesc = document.getElementById("popup-desc");
  const popupClose = document.getElementById("popup-close");
  const projectList = document.getElementById("project-list");
  const form = document.getElementById("project-form");

  let editKey = null;
  const projects = [];

// Закрытие при клике вне содержимого
popup.onclick = e => {
  if (e.target === popup) popup.classList.add("hidden");
};

// Функция открытия поп-апа для конкретного проекта
function showPopup(project) {
  popupTitle.textContent = project.name;
  popupDesc.innerHTML = project.description.replace(/\n/g, "<br>");
  popup.style.display = block;
  popup.classList.remove('hidden');
  popup.classList.add('hidden');
}

  // Инициализация карты
  const map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: {
        'italy-map': {
          type: 'image',
          url: 'img/italy.png',
          coordinates: [
            [6.627, 47.092],
            [18.520, 47.092],
            [18.520, 36.650],
            [6.627, 36.650]
          ]
        }
      },
      layers: [{
        id: 'italy-layer',
        type: 'raster',
        source: 'italy-map',
        paint: { 'raster-opacity': 1 }
      }]
    },
    center: [12.5, 42.5],
    zoom: 5,
    scrollZoom: false
  });

map.on('load', () => {
projects.forEach(p => addProjectToMap(p));
});

// Добавление маркера на карту
function addProjectToMap(project) {
  // Если маркер уже создан, не создаём новый
  if(project.marker) return;

  const el = document.createElement('div');
  el.className = 'project-marker';
  el.style.width = '50px';
  el.style.height = '50px';
  el.style.cursor = 'pointer';
  el.style.backgroundImage = 'url("img/circle.png")';
  el.style.backgroundSize = 'contain';   // сохраняем форму
  el.style.backgroundRepeat = 'no-repeat';
  el.style.backgroundPosition = 'center';
  el.style.borderRadius = '0';
  el.style.overFlow = 'visible';
  el.style.pointerEvents = 'auto';
  el.style.zIndex = 1000;

const popup = new maplibregl.Popup({ offset: 25, closeButton: true, closeOnClick: true })
    .setHTML(`<h2>${project.name}</h2><p>${project.description.replace(/\n/g, '<br>')}</p>`);

  const marker = new maplibregl.Marker(el)
    .setLngLat([project.lng, project.lat])
    .setPopup(popup) // вот это вместо кастомного click
    .addTo(map);

  project.marker = marker;
}

// Закрытие popup
popupClose.onclick = () => popup.classList.add('hidden');
popup.onclick = e => {
  if(e.target === popup) popup.classList.add('hidden');
};
  // Обновление списка проектов в sidebar
  function updateProjectList() {
    projectList.innerHTML = '';
    projects.forEach(p => {
      const li = document.createElement('li');
      li.textContent = p.name;

      // кнопка удаления
      const delBtn = document.createElement('button');
      delBtn.textContent = '❌';
      delBtn.style.marginLeft = '10px';
      delBtn.onclick = () => {
        if(p.marker) p.marker.remove();
        projectsRef.child(p.key).remove();
      };

      // кнопка редактирования
      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.style.marginLeft = '5px';
      editBtn.onclick = () => {
        document.getElementById('proj-name').value = p.name;
        document.getElementById('proj-desc').value = p.description;
        document.getElementById('proj-city').value = '';
        editKey = p.key;
      };

      li.appendChild(delBtn);
      li.appendChild(editBtn);
      projectList.appendChild(li);
    });
  }

 // Подгрузка проектов из Firebase
  projectsRef.on('value', snapshot => {
    const data = snapshot.val() || {};
    projects.length = 0; // очищаем массив
    Object.keys(data).forEach(key => {
      const p = data[key];
      p.key = key;
      projects.push(p);
      addProjectToMap(p);
    });
    updateProjectList();
  });

  // Обработка формы добавления/редактирования
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('proj-name').value.trim();
    const desc = document.getElementById('proj-desc').value.trim();
    const city = document.getElementById('proj-city').value.trim();

    let coords = { lat: 42.5, lng: 12.5 }; // дефолтные координаты
    if(city) {
      try {
        // ✅ fetch исправлен с обратными кавычками
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&countrycodes=IT`);
        const data = await res.json();
        if(data.length === 0) { alert("Città non trovata"); return; }
        coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      } catch(err) {
        alert("Errore nella ricerca della città"); 
        return;
      }
    }

    const projectData = { name, description: desc, lat: coords.lat, lng: coords.lng };

    if(editKey) {
      projectsRef.child(editKey).set(projectData);
      editKey = null;
    } else {
      const newRef = projectsRef.push();
      projectData.key = newRef.key;
      newRef.set(projectData);
    }

    form.reset();
  });
}; // <- закрываем window.onload
