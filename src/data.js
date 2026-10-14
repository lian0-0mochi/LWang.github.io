import galleries from './media.generated.json' with { type: 'json' };

export const profile = {
  name: 'Lianzijun Wang',
  preferredName: 'Lian Wang',
  title: 'PhD Candidate in Biology',
  affiliation: 'Duke University',
  location: 'Durham, North Carolina',
  email: 'lw385@duke.edu',
  cvPath: '/files/Lian_Wang_CV_2026.pdf',
  links: [
    { label: 'Duke Biology', href: 'https://biology.duke.edu/' },
    { label: 'ORCID', href: 'https://orcid.org/0000-0001-6467-4387' },
  ],
  intro:
    'Science, music, adventures, and the stories along the way.',
  biography:
    'Lianzijun (Lian) Wang is a Biology PhD student at Duke University in Dave Sherwood’s lab. Her research uses the C. elegans anchor cell invasion model to study how invasive cells breach basement membrane, reorganize their cytoskeleton, protect the plasma membrane, and adapt mitochondrial metabolism under mechanical challenge.',
};

export const pages = [
  { id: 'home', label: 'Home' },
  { id: 'science', label: 'Research' },
  { id: 'music', label: 'Pipa' },
  { id: 'exploration', label: 'Hobbies' },
  { id: 'about', label: 'About/CV' },
];

export const hero = {
  image: '/media/science/hero-microscopy-placeholder.svg',
  alt: 'Replaceable abstract microscopy placeholder image with glowing cellular forms.',
  eyebrow: 'Biology, image, sound, fieldwork',
  headline: 'A portfolio for close attention.',
  body:
    'Research, performance, and visual exploration gathered in one quiet, image-led space.',
};

export const homeAbout = {
  eyebrow: 'About me',
  chineseName: '王莲子君',
  hometown: 'Kunming, Yunnan, China',
  headline: 'Lianzijun Wang',
  subtitle: 'Research · Music · Exploration',
  story: [
    'I was born and raised in Kunming, Yunnan, China, a city nicknamed the City of Eternal Spring for its lovely year-round weather. Growing up surrounded by mountains, flowers, and some incredible food, I have always had a soft spot for nature and exploring the world around me.',
    'There is also a little story behind my name. 莲 means lotus, 子 can mean seed, and together 莲子 means lotus seed. 君 is associated with noble character, while 子君 has a classical, scholarly ring to it. My name draws inspiration from 爱莲说 (On the Love of the Lotus), a Chinese essay that celebrates the lotus for growing out of muddy waters while remaining beautiful and untainted.',
    'My own journey has taken me quite a distance from Kunming. I moved to the United States for college and earned my bachelor’s degree at Baylor University, where I studied Biochemistry and Cell & Molecular Biology. That is where I first fell in love with research in Dr. Myeongwoo Lee’s lab, working with C. elegans.',
    'Now, I am a Biology PhD student at Duke University in Dr. Dave Sherwood’s lab. My research focuses on how cells push, squeeze, and sometimes break through the physical barriers around them.',
    'Outside the lab, I love playing the pipa (琵琶), scuba diving, traveling, photography, snowboarding, and finding new ways to explore the world through a microscope, underwater, or somewhere I have never been before.',
    'Welcome to my corner of the pond.',
  ],
  hometownNote:
    'The City of Eternal Spring, and the place that taught me to notice mountains, flowers, food, and small living things.',
  education: [
    'PhD student in Biology, Duke University, Sherwood Lab',
    'Baylor University, Biochemistry and Cell & Molecular Biology',
    'Undergraduate research in Dr. Myeongwoo Lee’s lab using C. elegans',
  ],
};

export const educationTimeline = [
  {
    period: '2023 - Present',
    title: 'PhD candidate in Biology',
    place: 'Duke University, Department of Biology',
    detail: 'Ph.D. researcher in Dave Sherwood’s lab studying basement membrane invasion in C. elegans.',
  },
  {
    period: '2019–2023',
    title: 'B.S. — Double Major in Biochemistry and Biology',
    place: 'Baylor University',
    detail: 'Biology Concentration: Cell & Molecular Biology',
    honors: 'GPA: 4.0 · Summa Cum Laude',
  },
];

export const navigationCards = [
  {
    page: 'science',
    title: 'Research',
    kicker: '01',
    description: 'Cell invasion, basement membrane, microscopy, and C. elegans.',
    image: '/media/science/science-gallery-01.svg',
    alt: 'Replaceable microscopy placeholder for science gallery.',
  },
  {
    page: 'music',
    title: 'Pipa playing',
    kicker: '02',
    description: 'Pipa photos, recordings, and performance notes.',
    image: '/media/music/music-pipa-placeholder.svg',
    alt: 'Replaceable pipa performance placeholder image.',
  },
  {
    page: 'exploration',
    title: 'Hobbies',
    kicker: '03',
    description: 'Underwater photography, snowy trips, pets, and life outside the lab.',
    image: '/media/diving/underwater-01.svg',
    alt: 'Replaceable underwater photography placeholder image.',
  },
];

export const highlights = [
  {
    title: 'Dissertation Research',
    text: "Use this space for a concise description of Lian's current dissertation question, organism, methods, and broader biological context.",
  },
  {
    title: 'Scientific Imaging',
    text: 'A gallery format supports microscopy, specimen, and field images with captions, scale bars, and replaceable metadata.',
  },
  {
    title: 'Creative Practice',
    text: 'Music and exploration pages place performance, video, and underwater photography alongside academic work without blending the claims.',
  },
];

export const science = {
  photos: galleries.science,
  overview:
    'Published papers and ongoing projects are separated here so visitors can quickly move between completed work and current directions.',
  publishedWorks: [
    {
      id: 'mitochondria-invasion-2025',
      shortTitle: 'Mitochondria fuel invasion',
      title: 'Specialized High-Capacity Mitochondria Fuel Cell Invasion',
      authors:
        'Isabel W. Kenny-Ganzert, Lena P. Basta, Lianzijun Wang, Qiuyi Chi, Caitlin Su, Katherine S. Morton, Joel N. Meyer, David R. Sherwood',
      venue: 'bioRxiv preprint, 2025',
      year: '2025',
      summary:
        'This paper asks how an invasive cell gets enough energy at the exact place where it breaches basement membrane. The work identifies a specialized group of mitochondria in the C. elegans anchor cell that gathers near the invasion site, has high ATP-producing capacity, and is positioned by the cell invasion program.',
      figure: {
        src: '/media/science/2025.mitochondria-invasion/media/figure1.png',
        alt: 'Figure snapshot from the mitochondria cell invasion preprint.',
        caption: 'Main figure snapshot from the paper archive.',
      },
      journalLabel: 'bioRxiv article page',
      journalUrl: 'https://www.biorxiv.org/content/10.1101/2025.05.02.651978v1',
      pdfUrl: '/publications/2025.mitochondria-invasion/pdf/2025.05.02.651978v1.full.pdf',
    },
    {
      id: 'actin-nuclear-invasion-2025',
      shortTitle: 'Actin deforms nucleus',
      title: 'The Actin Protrusion Deforms the Nucleus During Invasion Through Basement Membrane',
      authors: "Johan d'Humieres, Lianzijun Wang, David R. Sherwood, Julie Plastino",
      venue: 'bioRxiv preprint, 2025',
      year: '2025',
      summary:
        'This study focuses on the physical side of basement membrane invasion. It shows that actin-based protrusions do more than push outward; they also deform the nucleus, helping the anchor cell move through a tight extracellular matrix barrier.',
      figure: {
        src: '/media/science/2025.actin-nuclear-invasion/media/figure1.png',
        alt: 'Figure snapshot from the actin protrusion and nuclear deformation preprint.',
        caption: 'Main figure snapshot from the paper archive.',
      },
      journalLabel: 'bioRxiv article page',
      journalUrl: 'https://www.biorxiv.org/content/10.1101/2025.03.13.643012v1',
      pdfUrl: '/publications/2025.actin-nuclear-invasion/pdf/2025.03.13.643012v1.full.pdf',
    },
    {
      id: 'lon1-cap-bmp-2025',
      shortTitle: 'LON-1 and BMP signaling',
      title:
        'The Caenorhabditis elegans LON-1 Protein Requires Its CAP Domain for Function in Regulating Body Size and BMP Signaling',
      authors:
        'Maria Victoria Serrano, Stephanie Cottier, Lianzijun Wang, Sergio Moreira-Antepara, Anthony Nzessi, Zhiyu Liu, Byron H. Williams, Myeongwoo Lee, Roger Schneiter, Jun Liu',
      venue: 'Genetics, 2025',
      year: '2025',
      summary:
        'This paper examines how LON-1 controls body size and BMP signaling in C. elegans. The key result is that conserved residues in the CAP domain are required for LON-1 function and sterol binding, connecting molecular binding behavior to organism-level size regulation.',
      figure: {
        src: '/media/science/2025.lon1-cap-bmp/media/figure1.png',
        alt: 'Figure snapshot from the LON-1 CAP domain Genetics paper.',
        caption: 'Main figure snapshot from the paper archive.',
      },
      journalLabel: 'Genetics article page',
      journalUrl: 'https://academic.oup.com/genetics/article/229/2/iyae202/7921103',
      pdfUrl: '/publications/2025.lon1-cap-bmp/pdf/iyae202.pdf',
    },
    {
      id: 'beta-integrin-serotonin-2024',
      shortTitle: 'Integrin and serotonin',
      title:
        'The beta Integrin Modulates Serotonin Sensitivity via NPxY Motifs to Regulate Egg Laying and Mechanosensation Behaviors in Caenorhabditis elegans',
      authors:
        'J. H. Bumm, D. D. Lee, Z. Qiu, A. H. Choi, M. Kolluri, M. J. Olsen, L. Wang, M. Lee',
      venue: 'Developmental Dynamics, 2024',
      year: '2024',
      summary:
        'This work links integrin signaling to animal behavior. By changing the phosphorylation state of beta integrin NPxY motifs in C. elegans, the study shows that those motifs influence serotonin sensitivity, egg laying, and mechanosensation.',
      figure: {
        src: '/media/science/2024.beta-integrin-serotonin/media/figure1.jpg',
        alt: 'Figure snapshot from the beta integrin serotonin sensitivity paper.',
        caption: 'Main figure snapshot from the paper archive.',
      },
      journalLabel: 'Developmental Dynamics article page',
      journalUrl: 'https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/dvdy.70090',
      pdfUrl:
        '/publications/2024.beta-integrin-serotonin/pdf/Developmental%20Dynamics%20-%202025%20-%20Bumm%20-%20The%20%20%20integrin%20modulates%20serotonin%20sensitivity%20via%20NPxY%20motifs%20to%20regulate%20egg.pdf',
    },
    {
      id: 'talin-integrin-2023',
      shortTitle: 'Talin-integrin motif',
      title: 'An Integrin Binding Motif in TLN-1/Talin Plays a Minor Role in Motility and Ovulation',
      authors:
        'Fereshteh Sadeghian, Ibrahim Ibrahim, Lokesh Ravichandran, Grace Henderson, Anisha Acharya, Lianzijun Wang, Myeongwoo Lee, Erin J. Cram',
      venue: 'microPublication Biology, 2023',
      year: '2023',
      summary:
        'This short paper tests how much one predicted talin-integrin binding site matters in living animals. The TLN-1(W387A) mutation produced mild motility and ovulation effects, suggesting this residue has a limited role in muscle and gonadal sheath function in vivo.',
      figure: {
        src: '/media/science/2023.talin-integrin/media/figure1.png',
        alt: 'Figure snapshot from the TLN-1 talin integrin binding motif paper.',
        caption: 'Main figure snapshot from the paper archive.',
      },
      journalLabel: 'microPublication Biology article page',
      journalUrl: 'https://www.micropublication.org/journals/biology/micropub-biology-000726',
      pdfUrl: '/publications/2023.talin-integrin/pdf/micropub-biology-000726.pdf',
    },
    {
      id: 'perlecan-rgd-2022',
      shortTitle: 'Perlecan RGD motif',
      title: 'The RGD (Arg-Gly-Asp) is a Potential Cell-Binding Motif of UNC-52/PERLECAN',
      authors: 'Zhongqiang Qiu, Aileen Park, Lianzijun Wang, Rachel Wilsey, Myeongwoo Lee',
      venue: 'Biochemical and Biophysical Research Communications, 2022',
      year: '2022',
      summary:
        'This paper studies an RGD motif in UNC-52/perlecan, a basement membrane protein. Mutating or deleting the motif disrupted muscle attachment-related phenotypes, supporting the idea that this motif acts as an important integrin-binding ligand during development.',
      figure: {
        src: '/media/science/2022.perlecan-rgd/media/figure1.jpg',
        alt: 'Figure snapshot from the UNC-52 perlecan RGD motif paper.',
        caption: 'Main figure snapshot from the paper archive.',
      },
      journalLabel: 'BBRC article page',
      journalUrl: 'https://www.sciencedirect.com/science/article/pii/S0006291X21016089',
      pdfUrl: '/publications/2022.perlecan-rgd/pdf/1-s2.0-S0006291X21016089-main.pdf',
    },
    {
      id: 'laminin-mutations-2021',
      shortTitle: 'Laminin RGD motif',
      title:
        'Mutations in the Cell-Binding Motif of lam-3/Laminin alpha Reveal Hypercontraction Behavior and Defective Sensitivity to Levamisole in Caenorhabditis elegans',
      authors: 'Lianzijun Wang, Zhongqiang Qiu, Myeongwoo Lee',
      venue: 'microPublication Biology, 2021',
      year: '2021',
      summary:
        'This paper characterizes the RGD motif in lam-3/laminin alpha. By generating RGE and delta-RGD mutations, the study connects cell-laminin interaction to body contraction control and levamisole sensitivity in C. elegans.',
      figure: {
        src: '/media/science/2021.laminin-mutations/media/figure1.jpg',
        alt: 'Figure snapshot from the lam-3 laminin alpha mutation paper.',
        caption: 'Main figure snapshot from the paper archive.',
      },
      journalLabel: 'microPublication Biology article page',
      journalUrl: 'https://www.micropublication.org/journals/biology/micropub-biology-000485',
      pdfUrl: '/publications/2021.laminin-mutations/pdf/paper.pdf',
    },
  ],
  ongoingWork: [
    {
      title: 'Dissertation Project Placeholder',
      body:
        'Describe the core biological question, model system, methods, and what stage the project is in. Keep this factual and update it as the project develops.',
      image: '/media/science/science-gallery-01.svg',
      alt: 'Replaceable microscopy placeholder for ongoing dissertation work.',
      status: 'Ongoing',
    },
    {
      title: 'Imaging and Analysis Placeholder',
      body:
        'Use this area for microscopy, image analysis, field sampling, or computational approaches that are not yet published.',
      image: '/media/science/science-gallery-03.svg',
      alt: 'Replaceable analysis placeholder for ongoing science work.',
      status: 'In progress',
    },
  ],
};

export const music = {
  overview:
    'Pipa has been part of my life since I was four years old.',
  photos: galleries.music,
  pipaIntro:
    'The pipa (琵琶, Chinese plucked lute) is a four-stringed Chinese plucked lute, known for its pear-shaped body, bright attack, and ability to move between lyrical singing lines and intensely percussive storytelling. Its ancestors traveled into China through Central and West Asian musical exchange, and by the Tang dynasty the pipa had become one of the iconic instruments of court and literati music. The repertoire includes poetic pieces such as 春江花月夜 (Moonlit River in Spring), dramatic narrative works such as 十面埋伏 (Ambush from Ten Sides), and beloved modern and regional pieces such as 大浪淘沙 (Great Waves Washing the Sand) and 彝族舞曲 (Dance of the Yi People).',
  personalNote:
    'I started learning pipa when I was four and received 业余琵琶十级 (Amateur Pipa Level 10) when I was twelve. This portrait was taken while I was playing at Jizushan, 鸡足山 (Jizu Mountain), a Buddhist mountain in Yunnan associated with pilgrimage, monastic practice, and the Mahakasyapa tradition.',
  videos: [
    {
      title: 'Recent Pipa Performance I',
      description: 'Recording starts at the pipa performance timestamp from the livestream.',
      url: 'https://www.youtube.com/live/0mfICpEBwic?si=-GFGvY_84mA5o6QC&t=1168',
      youtubeId: '0mfICpEBwic',
      start: 1168,
      embed: false,
    },
    {
      title: 'Recent Pipa Performance II',
      description: 'Recording starts at the pipa performance timestamp from the livestream.',
      youtubeId: 'f-RyFVn-hxs',
      start: 1921,
    },
  ],
};

const scubaGallery = galleries.diving;

export const exploration = {
  overview:
    'Visual notes from diving, snowboarding, pets, and small trips outside the lab.',
  categories: [
    {
      id: 'diving',
      route: 'hobbies/diving',
      title: 'Diving',
      subtitle: 'Scuba Diving & Freediving',
      description:
        'A growing collection of underwater photographs from scuba diving and free diving.',
      photos: scubaGallery,
    },
    {
      id: 'snowboarding',
      route: 'hobbies/snowboarding',
      title: 'Snowboarding',
      subtitle: 'Adventures on the Slopes',
      description: 'Add snowboarding photographs here when they are ready.',
      photos: galleries.snowboarding,
    },
    {
      id: 'companions',
      route: 'hobbies/companions',
      title: 'Little Companions',
      subtitle: 'My Pets',
      description: 'Add pet photographs here when they are ready.',
      photos: galleries.companions,
    },
  ],
  gallery: scubaGallery,
  videos: [
    {
      id: 'hobbies-video-01',
      originalSrc: '/media/hobbies-videos/hobbies-video-01.mp4',
      localSrc: '/media-originals/archive/hobbies-videos/hobbies-video-01.mp4',
      externalUrl: '',
      youtubeId: '',
      poster: '/media/diving/scuba-01.jpeg',
      title: 'Hobbies Video 01',
      caption: 'Personal video from the hobbies archive.',
      type: 'video/mp4',
    },
    {
      id: 'hobbies-video-02',
      originalSrc: '/media/hobbies-videos/hobbies-video-02.mp4',
      localSrc: '/media-originals/archive/hobbies-videos/hobbies-video-02.mp4',
      externalUrl: '',
      youtubeId: '',
      poster: '/media/diving/scuba-02.jpeg',
      title: 'Hobbies Video 02',
      caption: 'Personal video from the hobbies archive.',
      type: 'video/mp4',
    },
  ],
};

export const credentials = [
  'PhD Candidate in Biology, Duke University',
  'B.S. in Biochemistry and Biology, Cell & Molecular Biology concentration, Baylor University',
  'ORCID: 0000-0001-6467-4387',
];

export const cvSections = [
  {
    title: 'Research Experience',
    items: [
      {
        heading: 'Ph.D. Researcher, Duke University',
        meta: '2023 - Present | Mentor: Dave Sherwood, PhD',
        detail:
          'Investigates how invasive cells breach basement membrane using the C. elegans anchor cell invasion model, with emphasis on perlecan, membrane protection, mitochondrial adaptation, spectrin, and mechanical resilience.',
      },
      {
        heading: 'Undergraduate Researcher, Baylor University',
        meta: 'March 2021 - May 2023 | Mentor: Myeongwoo Lee, PhD',
        detail:
          'Used CRISPR-Cas9 genome editing and C. elegans microinjection to study extracellular matrix, cell adhesion, mechanosensation, egg-laying, and muscle function.',
      },
      {
        heading: 'B-TRUE Summer Fellow, Baylor University',
        meta: 'Summer 2020',
        detail:
          'Analyzed and presented a natural product synthesis study using pharmacophore-directed retrosynthesis.',
      },
    ],
  },
  {
    title: 'Selected Publications',
    items: [
      {
        heading: 'Specialized high-capacity mitochondria fuel cell invasion',
        meta: 'Current Biology, 2026',
        detail: 'Kenny-Ganzert, Basta, Wang, Chi, Kelley, Su, Leyhr, Morton, Meyer, and Sherwood.',
      },
      {
        heading:
          'The beta integrin modulates serotonin sensitivity via NPxY motifs to regulate egg laying and mechanosensation behaviors',
        meta: 'Developmental Dynamics, 2025',
        detail: 'Bumm, Lee, Qiu, Choi, Kolluri, Olsen, Wang, and Lee.',
      },
      {
        heading: 'The C. elegans LON-1 protein requires its CAP domain for function in regulating body size and BMP signaling',
        meta: 'Genetics, 2025',
        detail: 'Serrano, Cottier, Wang, Moreira-Antepara, Nzessi, Liu, Williams, Lee, Schneiter, and Liu.',
      },
      {
        heading: 'Mutations in the cell-binding motif of lam-3/laminin alpha',
        meta: 'microPublication Biology, 2021',
        detail: 'Wang, Qiu, and Lee.',
      },
    ],
  },
  {
    title: 'Presentations',
    items: [
      {
        heading: 'Plasma membrane damage and repair during anchor cell invasion',
        meta: 'Triangle Cytoskeleton Meeting, 2024',
        detail: 'Poster presentation.',
      },
      {
        heading: 'DEB-1/Vinculin proline-rich-linker roles in touch sensitivity and egg-laying',
        meta: 'Texas Genetics Society, 2023',
        detail: 'Poster presentation.',
      },
      {
        heading: 'Mutations in the cell-binding motif of lam-3/laminin alpha',
        meta: 'Capital of Texas Undergraduate Research Conference, 2022',
        detail: 'Oral presentation.',
      },
    ],
  },
  {
    title: 'Honors and Teaching',
    items: [
      {
        heading: 'URSA Scholars Week Outstanding Platform Presentation',
        meta: '2022 and 2023',
        detail: 'Recognized for undergraduate research presentations at Baylor University.',
      },
      {
        heading: 'Folmar Award and URSA Mini-Research Grant',
        meta: '2022 - 2023',
        detail: 'Research funding supporting C. elegans genetics and CRISPR-Cas9 work.',
      },
      {
        heading: 'Teaching Assistant, Duke Biology',
        meta: 'Fall 2024 - Spring 2025',
        detail: 'BIO 220 Cell Biology and BIO 202 Genetics and Evolution.',
      },
    ],
  },
];
