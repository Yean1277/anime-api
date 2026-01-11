const searchInput = document.getElementById("searchInput")
const searchBtn = document.getElementById("searchBtn")
const resultEl = document.getElementById("searchResult")
const listEl = document.getElementById("list")

let animeList = load()

// 启动时自动补全数据
hydrateAnimeList()
renderList()

// ---------------- 搜索 ----------------
searchBtn.onclick = search
searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") search()
})

function search() {
  const keyword = searchInput.value.trim()
  if (!keyword) return

  resultEl.innerHTML = "搜索中…"

  fetch(`https://api.bgm.tv/search/subject/${keyword}?type=2&responseGroup=small`)
    .then(res => res.json())
    .then(data => renderResult(data.list || []))
    .catch(() => {
      resultEl.innerHTML = "⚠️ 搜索失败（可能是 CORS）"
    })
}

// ---------------- 搜索结果 ----------------
function renderResult(list) {
  resultEl.innerHTML = ""

  list.forEach(s => {
    const anime = mapSearchData(s)

    const el = document.createElement("div")
    el.className = "result-item"

    el.innerHTML = `
      <img src="${anime.cover}">
      <div>${anime.titleJP}</div>
      <button class="add-btn">＋ 添加</button>
    `

    const btn = el.querySelector("button")
    btn.disabled = animeList.some(a => a.id === anime.id)
    btn.onclick = () => addAnime(anime)

    resultEl.appendChild(el)
  })
}

// ---------------- 添加 ----------------
function addAnime(anime) {
  if (animeList.find(a => a.id === anime.id)) return

  animeList.push(anime)
  save()
  hydrateOne(anime)
  renderList()
  renderResult([])
}

// ---------------- 自动补全 ----------------
function hydrateAnimeList() {
  animeList.forEach(anime => {
    if (!anime.hydrated) {
      hydrateOne(anime)
    }
  })
}

function hydrateOne(anime) {
  fetch(`https://api.bgm.tv/v0/subjects/${anime.id}`)
    .then(res => res.json())
    .then(full => {
      anime.summary = full.summary || anime.summary
      anime.eps = full.eps || anime.eps
      anime.cover = full.images?.common || anime.cover
      anime.hydrated = true
      save()
      renderList()
    })
    .catch(() => {
      console.warn("补全失败:", anime.titleJP)
    })
}

// ---------------- 渲染列表 ----------------
function renderList() {
  listEl.innerHTML = ""

  animeList.forEach((anime, index) => {
    const el = document.createElement("div")
    el.className = "item"

    el.innerHTML = `
      <img class="cover" src="${anime.cover}">
      <div class="info">
        <div class="title">${anime.titleJP}</div>
        <div class="eps">集数: ${anime.eps || 0}</div>
      </div>
    `

    // 点击展开详情
    el.onclick = () => {
      if (el.querySelector(".detail")) {
        el.querySelector(".detail").remove()
        return
      }

      const detail = document.createElement("div")
      detail.className = "detail"
      detail.innerHTML = `
        <div class="summary">${anime.summary || "加载中…"}</div>
        <button class="remove-btn">删除</button>
      `
      detail.querySelector(".remove-btn").onclick = (e) => {
        e.stopPropagation()
        animeList.splice(index, 1)
        save()
        renderList()
      }

      el.appendChild(detail)
    }

    listEl.appendChild(el)
  })
}

// ---------------- 数据映射 ----------------
function mapSearchData(s) {
  return {
    id: s.id,
    titleJP: s.name_cn || s.name,
    cover: s.images?.common || "",
    summary: "",
    eps: 0,
    hydrated: false
  }
}

// ---------------- Storage ----------------
function save() {
  localStorage.setItem("animeList", JSON.stringify(animeList))
}

function load() {
  return JSON.parse(localStorage.getItem("animeList")) || []
}
