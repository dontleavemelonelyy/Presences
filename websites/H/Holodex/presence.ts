const presence = new Presence({
		clientId: "860224040060715018",
	}),
	strings = presence.getStrings({
		play: "general.playing",
		pause: "general.paused",
	});

let iFrameVideo: { isPaused: boolean; thumbnail: string };

presence.on(
	"iFrameData",
	(data: { video: { isPaused: boolean; thumbnail: string } }) => {
		iFrameVideo = data.video;
	}
);

const getInfo = {
		generic: () => {
			return {
				getURLParameter: (name: string) => {
					return (
						decodeURIComponent(
							(new RegExp(`[?|&]${name}=` + "([^&;]+?)(&|#|;|$)").exec(
								location.search
							) || [null, ""])[1].replaceAll("+", "%20")
						) || null
					);
				},
			};
		},
		watch: () => {
			return {
				title:
					document.querySelectorAll(".v-card__title")[0].children[0]
						.textContent,
				channel: document
					.querySelector(".uploader-data-list>div:nth-child(1)")
					.textContent.split("  ")[0],
			};
		},
		channel: () => {
			return {
				title: document
					.querySelector(".channel-container .v-list-item__title")
					.textContent.split("  ")[0],
				getCategory: () => {
					switch (window.location.pathname.split("/")[3]) {
						case "clips":
							return "Clips";
						case "music":
							return "Music";
						case "collabs":
							return "Collabs";
						case "about":
							return "About Page";
						default:
							return "Videos";
					}
				},
			};
		},
		channels: () => {
			return {
				/**
				 * Get the Category on the Channels Page
				 */
				getCategory: () => {
					switch (
						[].indexOf.call(
							document.querySelector(
								"[role='tablist'] div.v-slide-group__content"
							).children,
							document.querySelector(
								"[role='tablist'] div.v-slide-group__content [aria-selected=true]"
							)
						)
					) {
						case 1:
							return "VTuber";
						case 2:
							return "Subber";
						case 3:
							return "Favorites";
						case 4:
							return "Blocked";
						default:
							return "Unsupported Category"; // This should never occur, if it occurs it's a holodex.net bug
					}
				},
			};
		},
		homeFavorites: () => {
			return {
				/**
				 * Gets the Category on the Home and Favorites Pages
				 */
				getCategory: () => {
					switch (window.location.hash) {
						case "":
							return "Live/Upcoming";
						case "#archive":
							return "Archive";
						case "#clips":
							return "Clips";
						default:
							return "Live/Upcoming";
					}
				},
			};
		},
		search: () => {
			return {
				/**
				 * Gets the parameters/tags from the Search page
				 */
				getParamsString: () => {
					let returnString = "";

					// Add Search type
					switch (getInfo.generic().getURLParameter("type")) {
						case "all":
							returnString += "Type: All, ";
							break;
						case "stream":
							returnString += "Type: Official, ";
							break;
						case "clip":
							returnString += "Type: Clip, ";
							break;
						default:
							returnString += "Type: All, ";
							break;
					}

					// Add Search query/tags
					for (const [i, val] of getInfo
						.generic()
						.getURLParameter("q")
						.split("\n")
						.entries()) {
						if (i > 0) {
							const tag = val.split(",");
							switch (tag[0]) {
								case "channel":
									returnString += `Channel: ${tag[2]}, `;
									break;
								case "title & desc":
									returnString += `Title/Desc: ${tag[2]}, `;
									break;
								case "comments":
									returnString += `Comments: ${tag[2]}, `;
									break;
								case "topic":
									returnString += `Topic: ${tag[2]}, `;
									break;
								case "org":
									returnString += `Org: ${tag[2]}, `;
									break;

								default:
									break;
							}
						}
					}

					return returnString.slice(0, -2); //Remove the last ", "
				},
			};
		},
	},
	/**
	 * The object that stores the data
	 */
	data = {
		details: `Unsupported Page: ${window.location.pathname}`,
		state: "",
		smallimage: {
			image: "largeimage",
			hover: "Holodex",
		},
		startTime: ~~(Date.now() / 1000),
	},
	/**
	 * This object stores functions that get the updated data
	 */
	dataUpdater = {
		updateAll: async () => {
			data.smallimage = await dataUpdater.getSmallImage();
			data.details = dataUpdater.getDetails();
			data.state = dataUpdater.getState();
		},
		getDetails: () => {
			const path = window.location.pathname.split("/");
			switch (path[1]) {
				case "home":
					return "Home";
				case "favorites":
					return "Favorites";
				case "channel":
					return path[2]
						? `Viewing Channel ${getInfo.channel().getCategory()}`
						: "Channel List";
				case "library":
					return "Library";
				case "playlists":
					return "Playlists";
				case "multiview":
					return "MultiView";
				case "music":
					return "Music";
				case "infinite":
					return "Mugen Clips";
				case "about":
					return "About";
				case "settings":
					return "Settings";
				case "login":
					return document.querySelector(".v-card.ma-auto.v-sheet .v-list") ===
						null
						? "Login Screen"
						: "Account Settings";
				case "watch":
					return `Watching ${getInfo.watch().title}`;
				case "search":
					return "Searching";

				default:
					return `Unsupported Page : ${window.location.pathname}`;
			}
		},
		getState: () => {
			const path = window.location.pathname.split("/");
			switch (path[1]) {
				case "watch":
					return `${getInfo.watch().channel}`;
				case "channel":
					return !path[2]
						? getInfo.channels().getCategory()
						: getInfo.channel().title;
				case "home":
					return getInfo.homeFavorites().getCategory();
				case "favorites":
					return getInfo.homeFavorites().getCategory();
				case "music":
					return document.querySelector(".music-player-bar") !== null
						? `Listening to ${
								document.querySelector(
									".music-player-bar>div>div:nth-child(2)>div:nth-child(2)>.single-line-clamp>a"
								).textContent
						  } - ${
								document.querySelector(
									".music-player-bar>div>div:nth-child(2)>div:nth-child(2)>.text-h6"
								).textContent
						  }`
						: "Not listening to anything";
				case "multiview":
					return `${document.querySelectorAll(".mv-frame").length} ${
						document.querySelectorAll(".mv-frame").length === 1
							? "Video"
							: "Videos"
					} Open`;
				case "infinite":
					return `${getInfo.watch().title} - ${getInfo.watch().channel}`;
				case "search":
					return getInfo.search().getParamsString();

				default:
					return "";
			}
		},
		getSmallImage: async () => {
			const path = window.location.pathname.split("/");
			switch (path[1]) {
				case "home":
					return {
						image: "mdihome",
						hover: "Home Page",
					};
				case "favorites":
					return {
						image: "mdiheart",
						hover: "Favorites",
					};
				case "channel":
					return {
						image: path.length < 3 ? "mdiaccountboxmultiple" : "mdiaccountbox",
						hover: path.length < 3 ? "Channels" : `${getInfo.channel().title}`,
					};
				case "library":
					return {
						image: "mdianimationplay",
						hover: "Library",
					};
				case "playlists":
					return {
						image: "mdiplaylistplay",
						hover: "Playlists",
					};
				case "multiview":
					return {
						image: "multiview",
						hover: "MultiView",
					};
				case "music":
					return {
						image: "mdimusic",
						hover: "Music",
					};
				case "infinite":
					return {
						image: "mdiinfinity",
						hover: "Mugen Clips",
					};
				case "about":
					return {
						image: "mdihelpcircle",
						hover: "About",
					};
				case "settings":
					return {
						image: "mdisettings",
						hover: "Settings",
					};
				case "login":
					return {
						image: "mdiloginvariant",
						hover:
							document.querySelector(".v-card.ma-auto.v-sheet .v-list") === null
								? "Login Screen"
								: "Account Settings",
					};
				case "watch":
					return {
						image: iFrameVideo.isPaused ? "mdipause" : "mdiplay",
						hover: iFrameVideo.isPaused
							? (await strings).pause
							: (await strings).play,
					};
				case "search":
					return {
						image: "mdimagnify",
						hover:
							getInfo.generic().getURLParameter("advanced") === "true"
								? "Advanced Search"
								: "Search",
					};

				default:
					return {
						image: "largeimage",
						hover: "Holodex",
					};
			}
		},
	};

presence.on("UpdateData", async () => {
	dataUpdater.updateAll();

	const presenceData: PresenceData = {
			largeImageKey:
				iFrameVideo.thumbnail ??
				"https://cdn.rcd.gg/PreMiD/websites/H/Holodex/assets/logo.png",
			smallImageKey: data.smallimage.image,
			smallImageText: data.smallimage.hover,
			details: data.details,
			startTimestamp: data.startTime,
		},
		cover = await presence.getSetting<boolean>("cover");

	if (data.state) presenceData.state = data.state;

	// Add video and channel buttons when on the watch page
	switch (window.location.pathname.split("/")[1]) {
		case "watch":
			presenceData.buttons = [
				{
					label: "Open Video",
					url: window.location.href,
				},
				{
					label: "Open Channel",
					url: `${window.location.origin}${document
						.querySelector(".uploader-data-list>div:nth-child(1)>a")
						.getAttribute("href")}`,
				},
			];
			break;
		case "channel":
			if (window.location.pathname.split("/")[2]) {
				presenceData.buttons = [
					{
						label: "Open Channel",
						url: window.location.href,
					},
				];
			}
	}

	if (
		!cover &&
		presenceData.largeImageKey !==
			"https://cdn.rcd.gg/PreMiD/websites/H/Holodex/assets/logo.png"
	) {
		presenceData.largeImageKey =
			"https://cdn.rcd.gg/PreMiD/websites/H/Holodex/assets/logo.png";
	}
	if (presenceData.details) presence.setActivity(presenceData);
	else presence.setActivity();
});
