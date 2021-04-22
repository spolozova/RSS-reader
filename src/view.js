import _ from 'lodash';

const onChange = require('on-change');

const validationHandler = (state, value) => {
  const feedback = document.querySelector('.feedback');
  const input = document.querySelector('input');
  feedback.classList.remove('text-success, text-danger');
  if (value === false) {
    feedback.classList.add('text-danger');
    input.classList.add('is-invalid');
  } else if (value === true) {
    input.classList.remove('is-invalid');
  }
  feedback.textContent = i18n.t(state.feedback);
};

const renderFeeds = (feeds) => {
  const feedContainer = document.querySelector('.feeds');
  feedContainer.innerHTML = `<h2>${i18n.t('posts')}</h2>`;
  const ulElement = document.createElement('ul');
  ulElement.classList.add('list-group, mb-5');
  feeds.forEach(({ title, description }) => {
    const liElement = document.createElement('li');
    liElement.classList.add('list-group-item');
    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    const pElement = document.createElement('p');
    pElement.textContent = description;
    ulElement.append(titleElement, pElement);
  });
  feedContainer.append(ulElement);
};

const renderModalButton = (state, id) => {
  const modalButton = document.createElement('button');
  modalButton.classList.add('btn', 'btn-primary', 'btn-sm');
  modalButton.dataset.id = id;
  modalButton.dataset.toggle = 'modal';
  modalButton.dataset.target = '#modal';
  modalButton.setAttribute('type', 'button');
  modalButton.textContent = i18n.t('buttons.postButton');
  modalButton.addEventListener('click', (e) => {
    e.preventDefault();
    state.readedPostsId = e.target.dataset.id;
    state.status = 'reading';
  });
};

const renderPosts = (state, posts) => {
  const postsContainer = document.querySelector('.posts');
  postsContainer.innerHTML = `<h2>${i18n.t('feeds')}</h2>`;
  const ulElement = document.createElement('ul');
  ulElement.classList.add('list-group');
  posts.forEach((post) => {
    const liEl = document.createElement('li');
    liEl.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
    const aEl = document.createElement('a');
    aEl.href = post.link;
    aEl.textContent = post.title;
    aEl.classList.add('font-weight-bold');
    aEl.setAttribute('data-id', post.id);
    aEl.setAttribute('target', '_blank');
    const buttonEl = renderModalButton(state, post.id);
    aEl('click', (e) => {
      state.readedPostsId.push(e.target.dataset('id'));
    });
    liEl.append(aEl, buttonEl);
    ulElement.prepend(liEl);
  });
  postsContainer.prepend(ulElement);
};

const processStateHandler = (state, value) => {
  const submitButton = document.querySelector('[type="submit"]');
  submitButton.disabled('false');
  const feedback = document.querySelector('.feedback');
  feedback.classList.remove('text-success', 'text-danger');
  const input = document.querySelector('form');
  if (value === 'validated') {
    submitButton.disabled = true;
  } else if (value === 'failed') {
    submitButton.disabled = false;
    feedback.classList.add('text-danger');
  } else if (value === 'succeeded') {
    feedback.classList.add('text-success');
    input.value = '';
  }
  feedback.textContent = i18n.t(state.feedback);
};

const readedPostsHandler = (values) => {
  values.forEach((value) => {
    const post = document.querySelector(`li[data-id=${value}]`);
    post.classList.remove('font-weight-bold');
    post.classList.add('font-weight-normal');
  });
};
const renderModalComponent = (state, value) => {
  const modal = document.querySelector('#modal');
  const readButton = modal.querySelector('full-article');
  if (value === 'reading') {
    document.body.classList.add('modal-open');
    modal.classList.add('show');
    modal.style.display = 'block';
    modal.style.paddingRight = '16px';
    modal.removeAttribute('aria-hidden');
    modal.ariaModal = 'true';
    modal.role = 'dialog';
    const post = _.find(state.posts, ['id', state.readedPostsId[-1]]);
    modal.querySelector('.modal-title').textContent = post.title;
    modal.querySelector('.modal.body').textContent = post.discription;
    readButton.href = post.link;
  } else {
    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.removeAttribute('aria-modal');
    modal.removeAttribute('role');
    modal.removeAttribute('padding-right');
    modal.setAttribute('aria-hidden', 'true');
  }
};

const initFormView = (state) => onChange(state, (path, value) => {
  switch (path) {
    case 'processState':
      processStateHandler(state, value);
      break;
    case 'valid':
      validationHandler(state, value);
      break;
    default:
      break;
  }
});

const initFeedsView = (state) => onChange(state, (path, value) => {
  switch (path) {
    case 'feeds':
      renderFeeds(value);
      break;
    case 'posts':
      renderPosts(state, value);
      break;
    case 'readedPostId':
      readedPostsHandler(value);
      break;
    case 'status':
      renderModalComponent(state, value);
      break;
    default:
      break;
  }
});

export { initFeedsView, initFormView };
