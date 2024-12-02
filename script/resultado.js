document.addEventListener("DOMContentLoaded", function() {
    const params = new URLSearchParams(window.location.search);
    const termo = params.get("query");

    if (termo) {
        document.getElementById("resultados").innerHTML = `<p>Exibindo resultados para: <strong>${termo}</strong></p>`;
    } else {
        document.getElementById("resultados").innerHTML = `<p>Nenhum termo foi pesquisado.</p>`;
    }
});
