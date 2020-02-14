$(async function () {
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $favList = $("#favorited-articles")
  const $navStories = $("#nav-my-stories")
  let storyList = null;
  let currentUser = null;
  await checkIfLoggedIn();


  $loginForm.on("submit", async function (evt) {
    evt.preventDefault();

    const username = $("#login-username").val();
    const password = $("#login-password").val();

    const userInstance = await User.login(username, password);
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });


  $createAccountForm.on("submit", async function (evt) {
    evt.preventDefault();

    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });


  $navLogOut.on("click", function () {
    localStorage.clear();
    location.reload();
  });

  $('#nav-submit').on('click', function () {
    $submitForm.slideToggle()
  })

  $navStories.on('click', function () {
    $favList.hide()
    hideElements()
    generateMystories()
  })


  $ownStories.on('click', '.trash', async function (evt) {
    const $tgt = $(evt.target)
    const li = $tgt.closest('li')
    const storyId = li.attr('id')
    await storyList.removeStory(currentUser, storyId)
    await generateStories()
    hideElements()
    generateMystories()

  })


  $('.articles-container').on('click', '.star', async function (evt) {
    if (currentUser) {
      const $tgt = $(evt.target)
      const li = $tgt.closest('li')
      const storyID = li.attr('id')
      if ($tgt.hasClass('fas')) {
        await currentUser.removeFavorite(storyID)
        $tgt.closest('i').toggleClass('fas far')

      } else {
        await currentUser.addFavorite(storyID)
        $tgt.closest('i').toggleClass('fas far')
      }
    }
  })

  $('body').on('click', '#nav-favorites', function () {
    hideElements()
    if (currentUser) {
      generateFav()
      $favList.show()
    }
  })


  $navLogin.on("click", function () {
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });


  $("body").on("click", "#nav-all", async function () {
    hideElements();
    await generateStories();
    $allStoriesList.show();
    $favList.hide()
  });

  $submitForm.on("submit", async function (e) {
    e.preventDefault()
    const author = $("#author").val()
    const title = $("#title").val()
    const url = $("#url").val()
    const username = currentUser.username
    const hostName = getHostName(url);

    const storyObj = await storyList.addStory(currentUser, {
      title,
      author,
      url,
      username
    })

    const $li = $(`
    <li id="${storyObj.storyId}">
      <span class="star"><i class="far fa-star"></i><span>   
      <a class="article-link" href="${url}" target="a_blank">
      <strong>${title}</strong>
      </a>
      <small class="article-author">by ${author}</small>
      <small class="article-hostname ${hostName}">(${hostName})</small>
      <small class="article-username">posted by ${username}</small>
    </li>
  `);
    $allStoriesList.prepend($li)
    $submitForm.slideUp("slow");
    $submitForm.trigger("reset");
  })


  async function checkIfLoggedIn() {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();

    }
  }


  function generateMystories() {
    $ownStories.empty()
    if (currentUser) {
      if (currentUser.ownStories.length > 0) {
        $ownStories.show()
        for (let story of currentUser.ownStories) {
          let storyHTML = generateStoryHTML(story, true)
          $ownStories.append(storyHTML)
        }
      } else {
        $ownStories.append('<h5>No stories added by user yet!</h5>')
      }
      $ownStories.show()
    }
  }

  function loginAndSubmitForm() {
    $loginForm.hide();
    $createAccountForm.hide();
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");
    $allStoriesList.show();
    showNavForLoggedInUser();
  }


  async function generateStories() {
    const storyListInstance = await StoryList.getStories();
    storyList = storyListInstance;
    $allStoriesList.empty();

    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  function generateFav() {
    $favList.empty()
    if (currentUser) {
      if (currentUser.favorites.length > 0) {
        for (let story of currentUser.favorites) {
          let favHTML = generateStoryHTML(story)
          $favList.append(favHTML)

        }
      } else {
        $favList.append("<h5>Favorites List Empty!</h5>")
      }
      $favList.show()
    }
  }

  function generateStoryHTML(story, isOwnStory) {
    let hostName = getHostName(story.url);

    let startype = isFavorite(story) ? 'fas' : 'far';

    let trashIcon = isOwnStory ? `<span class="trash"><i class="far fa-trash-alt"></i></span>` : ""
    const storyMarkup = $(`
      <li id="${story.storyId}">
      ${trashIcon}
      <span class="star"><i class="${startype} fa-star"></i></span>
       <a class="article-link" href="${story.url}" target="a_blank">
        <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  function isFavorite(story) {
    let favIds = new Set()
    if (currentUser) {
      favIds = new Set(currentUser.favorites.map(obj => obj.storyId))
    }
    return favIds.has(story.storyId)
  }

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm,

    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $(".main-nav-links").toggleClass("hidden")
  }


  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});