export function showToast(message) {
  console.log("hello");
  let toaster = document.getElementById("toaster");
  toaster.textContent = message;
  toaster.classList.add("show");
  setTimeout(() => {
    toaster.classList.remove("show");
  }, 2000);
}
export function highlightCurrentPage(currentPage, previousPage) {
  currentPage.classList.add("sidesection__currenthighlighter");
  previousPage.classList.remove("sidesection__currenthighlighter");
}
