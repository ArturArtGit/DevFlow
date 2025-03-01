const ROUTES = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  ASK_QUESTION: "/ask-question",
  COLLECTION: "/collection",
  COMMUNITY: "/community",
  TAGS: "/tags",
  JOBS: "/jobs",
  PROFILE: (id: string | number) => `/profile/${id}`,
  QUESTION: (id: string | number) => `/questions/${id}`,
  TAG: (id: string | number) => `/tags/${id}`,
}

export default ROUTES
