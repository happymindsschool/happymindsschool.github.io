/* Draft integration. Enable only after public responder approval and live tests. */
window.HappyMindsForms = Object.freeze({
  enabled: false,
  url: 'https://docs.google.com/forms/d/e/1FAIpQLSd3uM0Jl33__lV17BZ5fPQG_qFmF3lvK9emHkGoVCrWov_0gQ/viewform?embedded=true',
  render(container) {
    if (!this.enabled) return false;
    container.replaceChildren();
    const frame = document.createElement('iframe');
    frame.src = this.url;
    frame.title = 'HAPPY Minds School enquiry and admissions form';
    frame.style.cssText = 'display:block;width:100%;height:1900px;border:0;background:#fff;border-radius:12px';
    // Google controls the receipt inside the frame. Loading does not mean submitted.
    frame.textContent = 'Loading enquiry form…';
    const fallback = document.createElement('p');
    fallback.style.cssText = 'font-size:14px;margin:12px 0';
    const link = document.createElement('a');
    link.href = this.url.replace('?embedded=true','');
    link.target = '_blank'; link.rel = 'noopener';
    link.textContent = 'Open the enquiry form in a new tab';
    fallback.append(link);
    container.append(frame, fallback);
    container.hidden = false;
    return true;
  }
});
