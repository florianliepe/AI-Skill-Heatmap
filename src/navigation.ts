let pending: Promise<boolean> | null = null;

export function confirmDiscard(): Promise<boolean> {
  if (pending) return pending;
  const previous = document.activeElement as HTMLElement | null;
  pending = new Promise<boolean>((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "studio-confirm";
    dialog.setAttribute("aria-labelledby", "discard-title");
    dialog.innerHTML =
      '<h2 id="discard-title">Leave unsaved changes?</h2><p>Your edits have not been saved to the shared workspace.</p><div><button data-keep autofocus>Keep editing</button><button data-discard>Discard changes</button></div>';
    const finish = (answer: boolean) => {
      dialog.close();
      dialog.remove();
      pending = null;
      previous?.focus();
      resolve(answer);
    };
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      finish(false);
    });
    dialog
      .querySelector("[data-keep]")!
      .addEventListener("click", () => finish(false));
    dialog
      .querySelector("[data-discard]")!
      .addEventListener("click", () => finish(true));
    document.body.append(dialog);
    dialog.showModal();
  });
  return pending;
}

export async function requestNavigation() {
  const checks: Promise<boolean>[] = [];
  window.dispatchEvent(new CustomEvent("studio-navigate", { detail: checks }));
  return (await Promise.all(checks)).every(Boolean);
}

export function protectNavigation(
  event: Event,
  dirty: boolean,
  onDiscard?: () => void,
) {
  if (dirty)
    (event as CustomEvent<Promise<boolean>[]>).detail.push(
      confirmDiscard().then((allowed) => {
        if (allowed) onDiscard?.();
        return allowed;
      }),
    );
}
