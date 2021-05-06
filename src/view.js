const onChange = require('on-change');

const validationHandler = (value) => {
  const input = document.querySelector('input');
  const feedback = document.querySelector('.feedback');
  feedback.textContent = '';
  if (value === 'invalid') {
    input.classList.add('is-invalid');
  } else if (value === 'valid') {
    input.classList.remove('is-invalid');
  }
};

const processStateHandler = (t, value) => {
  const submitButton = document.querySelector('[type="submit"]');
  submitButton.removeAttribute('disabled');
  const feedback = document.querySelector('.feedback');
  feedback.textContent = '';
  const input = document.querySelector('input');
  if (value === 'loading') {
    submitButton.setAttribute('disabled', '');
    input.setAttribute('readonly', '');
  } else if (value === 'processed') {
    feedback.classList.remove('text-danger');
    feedback.classList.add('text-success');
    input.removeAttribute('readonly', '');
    input.value = '';
    feedback.textContent = t('success');
  } else {
    input.removeAttribute('readonly', '');
  }
};

const renderError = (t, value) => {
  const feedback = document.querySelector('.feedback');
  feedback.classList.remove('text-success');
  feedback.classList.add('text-danger');
  feedback.textContent = t(`errors.${value}`);
};

const renderFeeds = (t, feeds) => {
  const feedContainer = document.querySelector('.feeds');
  feedContainer.innerHTML = `<h2>${t('feeds')}</h2>`;
  const ulElement = document.createElement('ul');
  ulElement.classList.add('list-group', 'mb-5');
  feeds.forEach(({ title, description }) => {
    const liElement = document.createElement('li');
    liElement.classList.add('list-group-item');
    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    const pElement = document.createElement('p');
    pElement.textContent = description;
    liElement.append(titleElement, pElement);
    ulElement.append(liElement);
  });
  feedContainer.append(ulElement);
};

const renderModalButton = (t, id) => {
  const modalButton = document.createElement('button');
  modalButton.classList.add('btn', 'btn-primary', 'btn-sm');
  modalButton.dataset.id = id;
  modalButton.dataset.bsToggle = 'modal';
  modalButton.dataset.bsTarget = '#modal';
  modalButton.dataset.toggle = 'modal';
  modalButton.dataset.target = '#modal';
  modalButton.setAttribute('type', 'button');
  modalButton.textContent = t('buttons.postButton');
  return modalButton;
};

const renderPosts = (t, posts) => {
  const postsContainer = document.querySelector('.posts');
  postsContainer.innerHTML = '';
  const hEl = document.createElement('h2');
  hEl.textContent = t('posts');
  const ulElement = document.createElement('ul');
  ulElement.classList.add('list-group');
  posts.forEach((post) => {
    const liEl = document.createElement('li');
    liEl.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
    const aEl = document.createElement('a');
    aEl.href = post.link;
    aEl.textContent = post.title;
    const fontWeight = post.readed ? ['fw-normal', 'font-weight-normal'] : ['fw-bold', 'font-weight-bold'];
    aEl.classList.add('text-decoration-none', ...fontWeight);
    aEl.setAttribute('data-id', post.id);
    aEl.setAttribute('target', '_blank');
    aEl.setAttribute('rel', 'noopener noreferrer');
    const buttonEl = renderModalButton(t, post.id);
    liEl.append(aEl, buttonEl);
    ulElement.append(liEl);
  });
  postsContainer.append(hEl, ulElement);
};

const modalDialogHandler = (post) => {
  const readButton = document.querySelector('.full-article');
  document.querySelector('.modal-title').textContent = post.title;
  document.querySelector('.modal-body').textContent = post.description;
  readButton.href = post.link;
};

export default (t, state) => onChange(state, (path, value) => {
  switch (path) {
    case 'form.validationState':
      validationHandler(value);
      break;
    case 'feeds':
      renderFeeds(t, value);
      break;
    case 'posts':
      renderPosts(t, value);
      break;
    case 'processState':
      processStateHandler(t, value);
      break;
    case 'readedPost':
      modalDialogHandler(value);
      break;
    case 'loadingError':
      renderError(t, value);
      break;
    case 'form.validationError':
      renderError(t, value);
      break;
    default:
      break;
  }
});
