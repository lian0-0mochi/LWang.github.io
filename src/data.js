import siteContent from './content/site.json' with { type: 'json' };
import scienceContent from './content/science.json' with { type: 'json' };
import musicContent from './content/music.json' with { type: 'json' };
import hobbiesContent from './content/hobbies.json' with { type: 'json' };
import galleries from './media.generated.json' with { type: 'json' };
import videoData from './videos.json' with { type: 'json' };

export const videos = videoData;

export const profile = siteContent.profile;
export const pages = siteContent.pages;
export const hero = siteContent.hero;
export const homeAbout = siteContent.homeAbout;
export const educationTimeline = siteContent.educationTimeline;
export const navigationCards = siteContent.navigationCards;
export const highlights = siteContent.highlights;
export const credentials = siteContent.credentials;
export const cvSections = siteContent.cvSections;

export const science = {
  ...scienceContent,
  photos: galleries.science || [],
};

export const music = {
  ...musicContent,
  photos: galleries.music || [],
  videos: videoData.music || [],
};

const scubaGallery = galleries.diving || [];

export const exploration = {
  ...hobbiesContent,
  categories: (hobbiesContent.categories || []).map((cat) => ({
    ...cat,
    photos: galleries[cat.id] || [],
  })),
  gallery: scubaGallery,
  videos: videoData.diving || [],
};
