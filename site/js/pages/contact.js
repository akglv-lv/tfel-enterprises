import "../layout.js";
import { wireForm } from "../forms.js";

const form = document.querySelector("[data-contact-form]");
const topic = form.querySelector("[data-topic]");
const orderField = form.querySelector("[data-order-field]");

// Only ask for an order number when the message is about an order.
function syncOrder() {
	orderField.hidden = topic.value !== "order";
}
topic.addEventListener("change", syncOrder);

// ?topic=coaching (or order, business) pre-selects the dropdown, for links from other pages.
const preset = new URLSearchParams(location.search).get("topic");
if (preset && [...topic.options].some((o) => o.value === preset)) topic.value = preset;
syncOrder();

wireForm(form, "contact");
