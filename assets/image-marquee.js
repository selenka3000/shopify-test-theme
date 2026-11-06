if (!customElements.get('image-marquee')) {
  customElements.define(
    'image-marquee',
    class ImageMarquee extends HTMLElement {
      connectedCallback() {
        this.toggleButton = this.querySelector('.image-marquee__toggle');
        if (!this.toggleButton) return;

        this.toggleButton.hidden = false;
        this.updateButtonLabel();
        this.onToggle = () => {
          this.toggleAttribute('data-paused');
          this.updateButtonLabel();
        };
        this.toggleButton.addEventListener('click', this.onToggle);
      }

      updateButtonLabel() {
        const label = this.hasAttribute('data-paused')
          ? this.toggleButton.dataset.playLabel
          : this.toggleButton.dataset.pauseLabel;
        this.toggleButton.setAttribute('aria-label', label);
      }

      disconnectedCallback() {
        this.toggleButton?.removeEventListener('click', this.onToggle);
      }
    }
  );
}
