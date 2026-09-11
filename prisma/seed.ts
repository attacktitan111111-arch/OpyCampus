import { db } from "../src/lib/db";

const dice = (seed: string) => `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ffd5dc,b6e3f4,c0aede,d1f4c4,ffdfbf,c4f0ec`;

const users = [
  { username: "aria.chen", name: "Aria Chen", email: "aria@uni.edu", role: "student", bio: "CS junior • building tiny things • she/her", department: "Computer Science", verified: true },
  { username: "prof.nakamura", name: "Dr. Kenji Nakamura", email: "nakamura@uni.edu", role: "teacher", bio: "Professor of Distributed Systems. Office hours: Tue 2–4pm.", department: "Computer Science", verified: true },
  { username: "leo.mensah", name: "Leo Mensah", email: "leo@uni.edu", role: "student", bio: "Mech Eng '26 ☕ runner", department: "Mechanical Engineering", verified: false },
  { username: "sana.k", name: "Sana Kapoor", email: "sana@uni.edu", role: "student", bio: "Design + code. Currently obsessed with typography.", department: "Visual Communication", verified: true },
  { username: "marco.silva", name: "Marco Silva", email: "marco@uni.edu", role: "student", bio: "Exchange from Lisbon. Looking for a study group for Algorithms.", department: "Computer Science", verified: false },
  { username: "dr.owusu", name: "Dr. Abena Owusu", email: "owusu@college.edu", role: "teacher", bio: "Lecturer, Mathematics. I post problem sets & memes in equal measure.", department: "Mathematics", verified: true },
  { username: "yui.t", name: "Yui Tanaka", email: "yui@college.edu", role: "student", bio: "Literature nerd 📚 | writing my thesis on short fiction", department: "English Literature", verified: false },
  { username: "noah.b", name: "Noah Bennett", email: "noah@school.edu", role: "student", bio: "Year 12. Math team captain. Ask me about pi.", department: "STEM", verified: false },
  { username: "ms.fischer", name: "Ms. Helena Fischer", email: "fischer@school.edu", role: "teacher", bio: "Physics & Chemistry teacher. Curiosity is the curriculum.", department: "Science", verified: true },
  { username: "ravi.p", name: "Ravi Patel", email: "ravi@uni.edu", role: "student", bio: "Final year EE. Soldering is therapy.", department: "Electrical Engineering", verified: false },
  { username: "emma.l", name: "Emma Larsson", email: "emma@uni.edu", role: "student", bio: "Psych major. Coffee-powered. she/her", department: "Psychology", verified: false },
  { username: "jay.r", name: "Jay Rivera", email: "jay@uni.edu", role: "student", bio: "First year. Still figuring out how to adult.", department: "Undeclared", verified: false },
];

const institutions = [
  { name: "Northbridge University", handle: "northbridge", type: "university", bio: "Public research university est. 1894. Where curiosity becomes craft.", location: "Boston, MA", website: "northbridge.edu", isPrivate: false },
  { name: "Maplewood College", handle: "maplewood", type: "college", bio: "A liberal arts college for bold thinkers.", location: "Portland, OR", website: "maplewood.edu", isPrivate: false },
  { name: "Greenfield High", handle: "greenfield", type: "school", bio: "Secondary school, years 7–13. Traditions worth keeping.", location: "Austin, TX", website: "greenfield.school", isPrivate: true },
];

const postSeed = [
  { author: "aria.chen", content: "shipped my first open-source PR today and the maintainer merged it in 11 minutes. screaming internally (positively).", tags: "opensource,cs" },
  { author: "prof.nakamura", content: "Reminder: the midterm review session is Thursday 6pm in Hall C. Bring questions, not just anxiety. I'll bring coffee.", tags: "cs251" },
  { author: "leo.mensah", content: "ran 8km before my 9am thermodynamics lecture and I'm fairly sure I invented a new state of matter: tired-but-caffeinated solid.", tags: "running,life" },
  { author: "sana.k", content: "unpopular opinion: the best UI is the one you don't notice. the second best is the one you notice and smile.", tags: "design" },
  { author: "marco.silva", content: "anyone else find that writing notes by hand makes them stick way better? my iPad is collecting dust rn", tags: "study" },
  { author: "dr.owusu", content: "Problem of the week: prove that the sum of two consecutive triangular numbers is a perfect square. First correct reply gets a gold star (literally).", tags: "math,problemset" },
  { author: "yui.t", content: "finished rereading 'A Temporary Matter' by Jhumpa Lahiri at 2am and now I'm emotionally compromised. go read it.", tags: "books,literature" },
  { author: "noah.b", content: "math team practice tonight — we're doing combinatorics problems and I brought snacks. victory is measured in cookies.", tags: "math,mathteam" },
  { author: "ms.fischer", content: "Lab safety reminder: goggles are not optional. neither is curiosity. both are required to leave this room.", tags: "science,safety" },
  { author: "ravi.p", content: "spent 4 hours debugging a circuit that didn't work because a resistor was the wrong color band. i can now see resistor codes in my sleep.", tags: "ee,debugging" },
  { author: "emma.l", content: "today in cog psych we learned about the 'doorway effect' — forgetting why you entered a room because your brain context-switches. feeling very seen.", tags: "psych,science" },
  { author: "jay.r", content: "week 3 of uni and I've already used 'how are you' three different ways to mean three different things. adulthood is a language course.", tags: "firstyear,life" },
  { author: "aria.chen", content: "protip for group projects: write down who's doing what in a shared doc on day one. future-you will thank past-you.", tags: "study,tips" },
  { author: "prof.nakamura", content: "Office hours moved to Zoom today — link in the portal. Same warmth, fewer handshakes.", tags: "cs251,officehours" },
  { author: "sana.k", content: "redesigned my portfolio for the 14th time. this is the last one. (this is never the last one.)", tags: "design,portfolio" },
  { author: "leo.mensah", content: "thermodynamics is just the universe telling you everything falls apart eventually. relatable.", tags: "thermo" },
  { author: "marco.silva", content: "looking for 2–3 people for an Algorithms study group, weekly, low-pressure, high-snack. reply if interested.", tags: "study,algorithms" },
  { author: "dr.owusu", content: "To the student who left a hand-drawn proof under my door: it's correct, it's beautiful, and you should frame it. See me after class.", tags: "math" },
  { author: "yui.t", content: "writing a 300-word story is harder than a 3000-word essay. every comma has to earn its place.", tags: "writing" },
  { author: "noah.b", content: "captain's log: convinced the physics teacher to let us launch water rockets for 'data collection'. science is whatever you can get away with.", tags: "science,fun" },
  { author: "ravi.p", content: "my soldering iron died mid-joint. a moment of silence for the joint. (and for my wallet.)", tags: "ee" },
  { author: "emma.l", content: "the library at 11pm hits different. it's just you, 200 strangers, and a shared refusal to go home.", tags: "library,life" },
  { author: "ms.fischer", content: "Year 9 asked why the sky is blue and 40 minutes later we'd covered Rayleigh scattering, atomic spectra, and why sunsets are red. this is the job.", tags: "science,teaching" },
  { author: "aria.chen", content: "found a bug in my code that's been there for 3 weeks. it was a single missing semicolon. I have aged 3 years.", tags: "cs,debugging" },
  { author: "jay.r", content: "made a friend in the dining hall over a shared confusion about the soup of the day. college is just soup-based social networking.", tags: "life,firstyear" },
  { author: "prof.nakamura", content: "Reminder: late submissions lose 10%/day, but curiosity never loses points. Ask the question.", tags: "cs251" },
  { author: "sana.k", content: "color theory homework: pick two colors that 'shouldn't' work together and make them work. mine are mint and maroon. we'll see.", tags: "design,color" },
  { author: "leo.mensah", content: "study playlist update: lofi, rain, and the distant sound of my roommate also not sleeping.", tags: "study,music" },
];

async function main() {
  console.log("🌱 Seeding Scholar...");

  // Institutions
  const instMap: Record<string, any> = {};
  for (const inst of institutions) {
    const created = await db.institution.create({
      data: { ...inst, logoUrl: dice(inst.handle), coverUrl: `https://picsum.photos/seed/${inst.handle}-cover/1200/400` },
    });
    instMap[inst.handle] = created;
  }

  // Users — assign institutions
  const userMap: Record<string, any> = {};
  for (const u of users) {
    let institutionId: string | undefined;
    if (["aria.chen", "leo.mensah", "sana.k", "prof.nakamura", "marco.silva", "ravi.p", "emma.l", "jay.r"].includes(u.username)) {
      institutionId = instMap["northbridge"].id;
    } else if (["dr.owusu", "yui.t"].includes(u.username)) {
      institutionId = instMap["maplewood"].id;
    } else if (["noah.b", "ms.fischer"].includes(u.username)) {
      institutionId = instMap["greenfield"].id;
    }
    const created = await db.user.create({
      data: {
        email: u.email,
        username: u.username,
        name: u.name,
        bio: u.bio,
        role: u.role,
        verified: u.verified,
        department: u.department,
        avatarUrl: dice(u.username),
        institutionId,
      },
    });
    userMap[u.username] = created;

    if (institutionId) {
      const role = u.role === "teacher" ? "teacher" : "student";
      await db.institutionMember.create({
        data: { institutionId, userId: created.id, role, approved: true },
      });
    }
  }

  // Posts
  const postList: any[] = [];
  for (const p of postSeed) {
    const author = userMap[p.author];
    // greenfield posts go to the private institution feed
    const institutionId =
      author.institutionId === instMap["greenfield"].id ? instMap["greenfield"].id : null;
    const created = await db.post.create({
      data: {
        content: p.content,
        tags: p.tags || null,
        authorId: author.id,
        institutionId,
      },
    });
    postList.push(created);
  }

  // Follows — make a small social graph
  const followPairs: [string, string][] = [
    ["aria.chen", "prof.nakamura"],
    ["aria.chen", "sana.k"],
    ["aria.chen", "leo.mensah"],
    ["aria.chen", "marco.silva"],
    ["leo.mensah", "aria.chen"],
    ["leo.mensah", "ravi.p"],
    ["sana.k", "aria.chen"],
    ["sana.k", "yui.t"],
    ["marco.silva", "aria.chen"],
    ["marco.silva", "prof.nakamura"],
    ["ravi.p", "aria.chen"],
    ["ravi.p", "leo.mensah"],
    ["emma.l", "sana.k"],
    ["emma.l", "yui.t"],
    ["jay.r", "aria.chen"],
    ["jay.r", "emma.l"],
    ["noah.b", "ms.fischer"],
    ["yui.t", "sana.k"],
    ["dr.owusu", "prof.nakamura"],
  ];
  for (const [a, b] of followPairs) {
    await db.follow.create({ data: { followerId: userMap[a].id, followingId: userMap[b].id } });
  }

  // Likes — spread across posts
  const likeUsernames = ["aria.chen", "leo.mensah", "sana.k", "marco.silva", "ravi.p", "emma.l", "jay.r", "yui.t", "noah.b"];
  for (let i = 0; i < postList.length; i++) {
    const post = postList[i];
    const likers = likeUsernames
      .map((u) => userMap[u])
      .filter((u) => u.id !== post.authorId)
      .slice(0, ((i * 3) % 7) + 1);
    for (const liker of likers) {
      await db.like.create({ data: { userId: liker.id, postId: post.id } });
    }
  }

  // Bookmarks — a few
  await db.bookmark.create({ data: { userId: userMap["aria.chen"].id, postId: postList[5].id } });
  await db.bookmark.create({ data: { userId: userMap["aria.chen"].id, postId: postList[12].id } });
  await db.bookmark.create({ data: { userId: userMap["leo.mensah"].id, postId: postList[13].id } });

  // Reposts — a couple
  await db.repost.create({ data: { userId: userMap["sana.k"].id, postId: postList[3].id } });
  await db.repost.create({ data: { userId: userMap["marco.silva"].id, postId: postList[0].id } });

  // Replies — thread under the first post
  const firstPost = postList[0];
  const reply1 = await db.post.create({
    data: {
      content: "congrats!! what was the project, if you can share?",
      authorId: userMap["marco.silva"].id,
      parentId: firstPost.id,
    },
  });
  await db.post.create({
    data: {
      content: "a tiny CLI tool that formats JSON nicely. the maintainer was so kind about it 🥹",
      authorId: userMap["aria.chen"].id,
      parentId: firstPost.id,
    },
  });
  await db.post.create({
    data: {
      content: "11 minutes is iconic. celebrate accordingly.",
      authorId: userMap["leo.mensah"].id,
      parentId: firstPost.id,
    },
  });

  // Notifications for aria (the demo "you" user)
  await db.notification.create({ data: { type: "like", toUserId: userMap["aria.chen"].id, actorId: userMap["leo.mensah"].id, postId: firstPost.id } });
  await db.notification.create({ data: { type: "like", toUserId: userMap["aria.chen"].id, actorId: userMap["sana.k"].id, postId: firstPost.id } });
  await db.notification.create({ data: { type: "reply", toUserId: userMap["aria.chen"].id, actorId: userMap["marco.silva"].id, postId: reply1.id } });
  await db.notification.create({ data: { type: "follow", toUserId: userMap["aria.chen"].id, actorId: userMap["jay.r"].id } });
  await db.notification.create({ data: { type: "repost", toUserId: userMap["aria.chen"].id, actorId: userMap["marco.silva"].id, postId: firstPost.id } });

  console.log("✅ Seeded:", users.length, "users,", institutions.length, "institutions,", postList.length + 4, "posts");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
