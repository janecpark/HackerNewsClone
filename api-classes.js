const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";


class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  //static because you don't need to instantiate to get stories to show on homepage
  static async getStories() {
    const response = await axios.get(`${BASE_URL}/stories`);
    const stories = response.data.stories.map(story => new Story(story));
    const storyList = new StoryList(stories);
    return storyList;
  }

  async addStory(user, newStory) {
    const res = await axios({
      method: "POST",
      url: `${BASE_URL}/stories`,
      data: {
        token: user.loginToken,
        story: newStory
      }
    })
    newStory = new Story(res.data.story)
    this.stories.unshift(newStory)
    user.ownStories.unshift(newStory)
    return newStory
  }
  async removeStory(user, storyId) {
    await axios({
      method: "DELETE",
      url: `${BASE_URL}/stories/${storyId}`,
      data: {
        token: user.loginToken,
      }
    })
    this.stories = this.stories.filter(s => s.storyId !== storyId)
    user.ownStories = user.ownStories.filter(s => s.storyId !== storyId)
  }
}

class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }

  static async create(username, password, name) {
    const response = await axios.post(`${BASE_URL}/signup`, {
      user: {
        username,
        password,
        name
      }
    });

    const newUser = new User(response.data.user);
    newUser.loginToken = response.data.token;
    return newUser;
  }

  static async login(username, password) {
    const response = await axios.post(`${BASE_URL}/login`, {
      user: {
        username,
        password
      }
    });

    const existingUser = new User(response.data.user);
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    existingUser.loginToken = response.data.token;
    return existingUser;
  }

  static async getLoggedInUser(token, username) {
    if (!token || !username) return null;
    const response = await axios.get(`${BASE_URL}/users/${username}`, {
      params: {
        token
      }
    });

    const existingUser = new User(response.data.user);
    existingUser.loginToken = token;
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    return existingUser;
  }

  addFavorite(storyId) {
    return this.toggleFav(storyId, "POST")
  }

  removeFavorite(storyId) {
    return this.toggleFav(storyId, "DELETE")
  }

  async toggleFav(storyID, verb) {
    await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${storyID}`,
      method: verb,
      data: {
        token: this.loginToken
      }
    })
    await this.retrieveDetails()
    return this;
  }
  async retrieveDetails() {
    const res = await axios.get(`${BASE_URL}/users/${this.username}`, {
      params: {
        token: this.loginToken
      }
    })
    this.name = res.data.user.name;
    this.createdAt = res.data.user.createdAt;
    this.updatedAt = res.data.user.updatedAt;
    this.favorites = res.data.user.favorites.map(s => new Story(s));
    this.ownStories = res.data.user.stories.map(s => new Story(s))
    return this
  }
}

class Story {
  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }
}