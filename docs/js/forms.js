// Every form on the site (coaching applications, contact, drop alerts) sends through send().
// Nothing is connected yet, so it just checks the data and reports back.
// To connect later, change send() only: for example POST to Formspree or Netlify Forms,
// add drop-alert emails to Mailchimp, or send coaching applications to Tyler's inbox.

export const CONNECTED = false;

export async function send(formName, data) {
	// Visible in the browser console while testing, so we can see exactly what would be sent.
	console.info(`[form:${formName}] would send`, data);
	return { ok: true, connected: CONNECTED };
}

// Wires up a <form>: checks required fields with friendly messages, sends it,
// then swaps the form for its "done" panel (the element right after it with class form__done).
export function wireForm(form, formName, { onDone } = {}) {
	form.noValidate = true;
	const done = form.nextElementSibling?.classList.contains("form__done") ? form.nextElementSibling : null;

	function fieldOf(input) {
		return input.closest(".field") || input.closest(".check") || input.parentElement;
	}
	function showError(input) {
		const field = fieldOf(input);
		field.classList.toggle("has-error", !input.validity.valid);
		let msg = field.querySelector(".field__error");
		if (input.validity.valid) {
			msg?.remove();
			return;
		}
		if (!msg) {
			msg = document.createElement("span");
			msg.className = "field__error";
			field.appendChild(msg);
		}
		msg.textContent = messageFor(input);
	}
	function messageFor(input) {
		const v = input.validity;
		if (v.valueMissing) return input.type === "checkbox" ? "Please tick this box." : "Please fill this in.";
		if (v.typeMismatch && input.type === "email") return "That email doesn't look right. Check for typos.";
		if (v.tooShort) return `Please write at least ${input.minLength} characters.`;
		return input.validationMessage;
	}

	form.addEventListener("input", (e) => {
		if (fieldOf(e.target)?.classList.contains("has-error")) showError(e.target);
	});

	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		const inputs = [...form.elements].filter((el) => el.willValidate);
		inputs.forEach(showError);
		const firstBad = inputs.find((el) => !el.validity.valid);
		if (firstBad) {
			firstBad.focus();
			return;
		}
		const submit = form.querySelector("[type=submit]");
		if (submit) submit.disabled = true;
		const data = Object.fromEntries(new FormData(form));
		const result = await send(formName, data);
		if (submit) submit.disabled = false;
		if (!result.ok) return;
		if (done) {
			const note = done.querySelector("[data-not-connected]");
			if (note) note.hidden = result.connected;
			form.hidden = true;
			done.hidden = false;
			done.setAttribute("tabindex", "-1");
			done.focus();
		}
		onDone?.(data);
	});
}
