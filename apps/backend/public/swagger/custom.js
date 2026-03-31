(function waitForSwagger() {
  const header = document.querySelector('.swagger-ui .topbar');
  const container = document.querySelector('.swagger-ui');
  const rootUrl = new URL('/', globalThis.location.href).toString();

  if (header) {
    let btnContainer = document.querySelector('.swagger-button-container');
    if (!btnContainer) {
      btnContainer = document.createElement('div');
      btnContainer.className = 'swagger-button-container';
      header.appendChild(btnContainer);
    }

    const buttons = [
      { text: 'Webpage', link: rootUrl, newTab: false },
      { text: 'Terms of Service', link: 'https://github.com/BrNi05/CourseHub/blob/main/legal/tos.md' },
      { text: 'Privacy Policy', link: 'https://github.com/BrNi05/CourseHub/blob/main/legal/privacy.md' },
    ];

    buttons.forEach(btnData => {
      if (!btnContainer.querySelector(`button[data-text="${btnData.text}"]`)) {
        const btn = document.createElement('button');
        btn.innerText = btnData.text;
        btn.onclick = () =>
          btnData.newTab === false
            ? globalThis.location.assign(btnData.link)
            : globalThis.open(btnData.link, '_blank');
        btn.className = 'swagger-button';
        btn.dataset.text = btnData.text;
        btnContainer.appendChild(btn);
      }
    });
  }

  if (!header || !container) {
    setTimeout(waitForSwagger, 300);
  }
})();
