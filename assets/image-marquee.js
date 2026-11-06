if (!customElements.get('image-marquee')) {
  customElements.define(
    'image-marquee',
    class ImageMarquee extends HTMLElement {
      connectedCallback() {
        this.toggleButton = this.querySelector('.image-marquee__toggle');
        if (!this.toggleButton) return;

        // Reveal playback controls only after the custom element can handle them.
        this.toggleButton.hidden = false;
        this.updateButtonLabel();
        this.onToggle = () => {
          this.toggleAttribute('data-paused');
          this.updateButtonLabel();
        };
        this.toggleButton.addEventListener('click', this.onToggle);
      }

      updateButtonLabel() {
        // Describe the next action; CSS reads data-paused to control the animation.
        const label = this.hasAttribute('data-paused')
          ? this.toggleButton.dataset.playLabel
          : this.toggleButton.dataset.pauseLabel;
        this.toggleButton.setAttribute('aria-label', label);
      }

      disconnectedCallback() {
        // The theme editor can remove and reconnect the same section instance.
        this.toggleButton?.removeEventListener('click', this.onToggle);
      }
    }
  );
}
