const form = document.querySelector("[data-testid='registration-form']");
const result = document.querySelector("[data-testid='registration-result']");

const output = {
  user: document.querySelector("[data-testid='created-user']"),
  email: document.querySelector("[data-testid='created-email']"),
  company: document.querySelector("[data-testid='created-company']"),
  role: document.querySelector("[data-testid='created-role']"),
  country: document.querySelector("[data-testid='created-country']")
};

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const data = new FormData(form);
  const registration = Object.fromEntries(data.entries());

  output.user.textContent = `${registration.firstName} ${registration.lastName}`;
  output.email.textContent = registration.email;
  output.company.textContent = registration.company;
  output.role.textContent = registration.role;
  output.country.textContent = registration.country;
  result.hidden = false;
});
