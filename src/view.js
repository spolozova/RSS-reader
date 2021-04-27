import _ from 'lodash';

const onChange = require('on-change');

const validationHandler = (t, state, value) => {
  const input = document.querySelector('input');
  if (value === false) {
    input.classList.add('is-invalid');
  } else if (value === true) {
    input.classList.remove('is-invalid');
  }
};

const processStateHandler = (t, state, value) => {
  const submitButton = document.querySelector('[type="submit"]');
  submitButton.removeAttribute('disabled');
  const feedback = document.querySelector('.feedback');
  feedback.textContent = '';
  const input = document.querySelector('input');
  if (value === 'validation') {
    submitButton.setAttribute('disabled', '');
    input.setAttribute('readonly', '');
  } else if (value === 'failed') {
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
    input.removeAttribute('readonly', '');
  } else if (value === 'succeeded') {
    feedback.classList.remove('text-danger');
    feedback.classList.add('text-success');
    input.removeAttribute('readonly', '');
    input.value = '';
  }
  feedback.textContent = t(state.form.feedback);
};

const readedPostsHandler = (values) => {
  values.forEach((value) => {
    const post = document.querySelector(`[data-id="${value}"]`);
    post.classList.remove('fw-bold');
    post.classList.add('fw-normal');
  });
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
  modalButton.setAttribute('type', 'button');
  modalButton.textContent = t('buttons.postButton');
  return modalButton;
};

const renderPosts = (t, posts, state) => {
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
    aEl.classList.add('fw-bold', 'text-decoration-none');
    aEl.setAttribute('data-id', post.id);
    aEl.setAttribute('target', '_blank');
    aEl.setAttribute('rel', 'noopener noreferrer');
    const buttonEl = renderModalButton(t, post.id);
    liEl.append(aEl, buttonEl);
    ulElement.append(liEl);
  });
  postsContainer.append(hEl, ulElement);
  if (state.readedPostsId.length !== 0) {
    readedPostsHandler(state.readedPostsId);
  }
};

const modalComponentHandler = (state, value) => {
  const readButton = document.querySelector('.full-article');
  if (value === 'reading') {
    const { length } = state.readedPostsId;
    const post = _.find(state.posts, { id: Number(state.readedPostsId[length - 1]) });
    document.querySelector('.modal-title').textContent = post.title;
    document.querySelector('.modal-body').textContent = post.description;
    readButton.href = post.link;
  }
};

export default (t, state) => onChange(state, (path, value) => {
  switch (path) {
    case 'form.state':
      processStateHandler(t, state, value);
      break;
    case 'form.valid':
      validationHandler(t, state, value);
      break;
    case 'feeds':
      renderFeeds(t, value);
      break;
    case 'posts':
      renderPosts(t, value, state);
      break;
    case 'readedPostsId':
      readedPostsHandler(value);
      break;
    case 'processState':
      modalComponentHandler(state, value);
      break;
    default:
      break;
  }
});
