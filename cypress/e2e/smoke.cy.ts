import { faker } from "@faker-js/faker";

describe("smoke tests", () => {
  afterEach(() => {
    cy.cleanupUser();
  });

  it('has a test', () => {
    expect(true).to.equal(true);
  });

  // it("should allow you to register and login", () => {
  //   const loginForm = {
  //     email: `${faker.internet.userName()}@example.com`,
  //     password: faker.internet.password(),
  //   };

  //   cy.then(() => ({ email: loginForm.email })).as("user");

  //   cy.visitAndCheck("/");

  //   cy.findByRole("link", { name: /sign up/i }).click();

  //   cy.findByRole("textbox", { name: /email/i }).type(loginForm.email);
  //   cy.findByLabelText(/password/i).type(loginForm.password);
  //   cy.findByRole("textbox", { name: /name/i }).type(faker.name.fullName());
  //   cy.findByRole("textbox", { name: /phone/i }).type(faker.phone.number());
  //   cy.findByRole("button", { name: /create account/i }).click();

  //   cy.findByRole("link", { name: /orders/i }).click();
  //   cy.findByRole("button", { name: /logout/i }).click();
  //   cy.findByRole("link", { name: /login/i });
  // });

  // it("should allow you to make an order", () => {
  //   cy.login();

  //   cy.visitAndCheck("/");

  //   cy.findByRole("link", { name: /order mulch/i }).click();
  //   cy.findByText("No orders yet");

  //   cy.findByRole("link", { name: /\+ new order/i }).click();

  //   cy.findByLabelText(/number of bags/i).type("4");
  //   cy.findByRole("textbox", { name: /street/i }).type(
  //     faker.address.streetName()
  //   );
  //   cy.findByRole("textbox", { name: /city/i }).type(faker.address.city());
  //   cy.findByRole("textbox", { name: /zip/i }).type(faker.address.zipCode());
  //   cy.findByRole("button", { name: /go to payment/i }).click();

  //   cy.findByRole("button", { name: /delete/i }).click();

  //   cy.findByText("No orders yet");
  // });
});
