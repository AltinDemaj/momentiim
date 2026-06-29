export type AppLocale = 'sq' | 'en' | 'de';

export const LOCALE_LABELS: Record<AppLocale, string> = {
  sq: 'Shqip',
  en: 'English',
  de: 'Deutsch',
};

export const DEFAULT_LOCALE: AppLocale = 'sq';

export type TranslationKey =
  | 'tabs.home'
  | 'tabs.camera'
  | 'tabs.keepsakes'
  | 'tabs.profile'
  | 'camera.noEvent'
  | 'camera.noEventHint'
  | 'camera.permission'
  | 'camera.permissionHint'
  | 'camera.enableCamera'
  | 'camera.photo'
  | 'camera.reel'
  | 'camera.iSpy'
  | 'camera.voice'
  | 'camera.uploadFailed'
  | 'camera.tryAgain'
  | 'camera.captureError'
  | 'camera.reelFailed'
  | 'camera.recordingError'
  | 'camera.zoom'
  | 'camera.quality'
  | 'camera.previewTitle'
  | 'camera.previewHint'
  | 'camera.retake'
  | 'camera.sendPhoto'
  | 'home.brand'
  | 'home.greeting'
  | 'home.guest'
  | 'home.loading'
  | 'home.yourKeepsakes'
  | 'home.viewAll'
  | 'home.noEvent'
  | 'home.joinEvent'
  | 'home.scanQr'
  | 'memories.title'
  | 'memories.subtitle'
  | 'memories.emptyTitle'
  | 'memories.emptyHint'
  | 'memories.developed'
  | 'memories.developing'
  | 'memories.moments'
  | 'memories.tapOpen'
  | 'profile.editHint'
  | 'profile.save'
  | 'profile.yourName'
  | 'profile.journey'
  | 'profile.events'
  | 'profile.moments'
  | 'profile.memoriesDeveloped'
  | 'profile.achievements'
  | 'profile.preferences'
  | 'profile.language'
  | 'profile.notifications'
  | 'profile.privacy'
  | 'profile.support'
  | 'profile.notificationsTitle'
  | 'profile.notificationsBody'
  | 'profile.privacyTitle'
  | 'profile.privacyBody'
  | 'profile.helpTitle'
  | 'profile.helpBody'
  | 'profile.callSupport'
  | 'profile.close'
  | 'profile.guest'
  | 'profile.achievement.firstWedding'
  | 'profile.achievement.hundredMoments'
  | 'profile.achievement.nightPhotographer'
  | 'profile.achievement.reelMaker'
  | 'join.title'
  | 'join.subtitle'
  | 'join.placeholder'
  | 'join.button'
  | 'join.codeError'
  | 'home.moreKeepsakes'
  | 'home.seeAll'
  | 'home.open'
  | 'home.joinCelebration'
  | 'memories.developedShort'
  | 'memories.disposableCamera'
  | 'join.scanButton'
  | 'join.note'
  | 'album.developing'
  | 'album.developingHint'
  | 'album.yourVoice'
  | 'album.voiceHint'
  | 'album.keepsakeAlbum'
  | 'album.hostedBy'
  | 'album.reels'
  | 'album.watchReel'
  | 'album.findPhotos'
  | 'album.viewOnly'
  | 'album.emptyTitle'
  | 'album.emptyHint'
  | 'album.selectHint'
  | 'album.selectMode'
  | 'album.reel'
  | 'album.selected'
  | 'audio.title'
  | 'audio.hint'
  | 'audio.remaining'
  | 'audio.yourRecording'
  | 'audio.listenThenSend'
  | 'audio.tapToRecord'
  | 'audio.rerecord'
  | 'audio.send'
  | 'audio.close'
  | 'audio.micPermission'
  | 'audio.micPermissionHint'
  | 'audio.saved'
  | 'audio.savedHint'
  | 'audio.recordingError'
  | 'audio.voiceMessage'
  | 'scavenger.title'
  | 'scavenger.subtitle'
  | 'find.title'
  | 'find.hint'
  | 'find.enableCamera'
  | 'find.search'
  | 'find.yours'
  | 'find.noMatches'
  | 'find.noMatchesHint'
  | 'find.searchFailed'
  | 'scan.title'
  | 'scan.hint'
  | 'scan.enable'
  | 'scan.back'
  | 'scan.align'
  | 'scan.sources'
  | 'event.joining'
  | 'event.joinFailed'
  | 'home.live'
  | 'home.guests'
  | 'home.celebration'
  | 'home.captureCelebration'
  | 'home.cameraReady'
  | 'home.ceremonySoon'
  | 'home.ceremonyUnderway'
  | 'home.memoriesAwait'
  | 'home.shotsLeft'
  | 'home.reelsLeft'
  | 'home.album'
  | 'home.ready'
  | 'home.soon'
  | 'home.viewAlbum'
  | 'home.opensIn'
  | 'home.openCamera'
  | 'home.filmRoll'
  | 'home.activeEvent'
  | 'home.collecting'
  | 'home.developmentIn'
  | 'home.yourMemories'
  | 'common.guest'
  | 'common.delete'
  | 'common.cancel'
  | 'common.confirm'
  | 'common.tryAgain'
  | 'delete.photoTitle'
  | 'delete.photoMessage'
  | 'delete.audioTitle'
  | 'delete.audioMessage'
  | 'delete.success'
  | 'delete.failed'
  | 'referral.banner'
  | 'album.filterAll'
  | 'album.filterPhotos'
  | 'album.filterVideos'
  | 'album.show'
  | 'album.playSlideshow'
  | 'album.slideshowSub'
  | 'album.actions'
  | 'album.done'
  | 'album.select'
  | 'album.saveAll'
  | 'album.share'
  | 'album.saveSelected'
  | 'album.selectBelow'
  | 'album.savingLibrary'
  | 'album.downloadingPhoto'
  | 'album.downloadingReel'
  | 'album.saved'
  | 'album.couldNotSave'
  | 'album.savedMoment'
  | 'album.checkPermissions'
  | 'album.couldNotShare'
  | 'album.sharingUnavailable'
  | 'album.selectMoments'
  | 'album.selectMomentsHint'
  | 'album.savingCount'
  | 'album.toCameraRoll'
  | 'album.partialSaved'
  | 'album.saveEntireAlbum'
  | 'album.saveAllConfirm'
  | 'album.albumSaved'
  | 'share.opening'
  | 'share.chooseWhere'
  | 'share.loadingMoment'
  | 'share.preparing'
  | 'share.justMoment'
  | 'lightbox.swipeHint'
  | 'lightbox.pauseSlideshow'
  | 'lightbox.resumeSlideshow'
  | 'reel.playerSubtitle'
  | 'reel.notReady'
  | 'exposure.ofRemaining'
  | 'film.label'
  | 'profile.enableNotifications'
  | 'profile.notificationsOn'
  | 'profile.viewPrivacyPolicy'
  | 'profile.whatsapp'
  | 'profile.viber'
  | 'profile.instagram'
  | 'camera.previewReelTitle'
  | 'camera.previewReelHint'
  | 'camera.sendReel'
  | 'camera.previewGalleryHint'
  | 'home.tonight'
  | 'home.revealReady'
  | 'home.revealsTomorrow'
  | 'home.revealsOn'
  | 'greeting.morning'
  | 'greeting.afternoon'
  | 'greeting.evening'
  | 'upload.guestLimitExceeded'
  | 'upload.eventPoolExhausted'
  | 'upload.eventNotActive'
  | 'upload.reservationExpired'
  | 'upload.failed'
  | 'upload.fileMissing'
  | 'upload.photoReadFailed'
  | 'upload.permissionDeniedCamera'
  | 'upload.permissionDeniedGallery'
  | 'upload.videoLimitExceeded'
  | 'upload.videoNotAllowed'
  | 'upload.videoTooShort'
  | 'upload.videoTooLong'
  | 'upload.videoFileMissing'
  | 'upload.notJoined'
  | 'upload.unknown'
  | 'push.requiresDevice'
  | 'push.permissionDenied'
  | 'push.notSignedIn'
  | 'push.registerFailed';

type Dict = Record<TranslationKey, string>;

export const translations: Record<AppLocale, Dict> = {
  sq: {
    'tabs.home': 'Kryefaqja',
    'tabs.camera': 'Kamera',
    'tabs.keepsakes': 'Kujtime',
    'tabs.profile': 'Profili',
    'camera.noEvent': 'Nuk ka event aktiv',
    'camera.noEventHint': 'Bashkohu në një event nga Kryefaqja për të ngarkuar filmin tënd.',
    'camera.permission': 'Qasja në kamerë',
    'camera.permissionHint': 'Kërkohet për të kapur momentet në rrotën tënde.',
    'camera.enableCamera': 'Aktivizo kamerën',
    'camera.photo': 'Foto',
    'camera.reel': 'Reel',
    'camera.iSpy': 'I Spy',
    'camera.voice': 'Zëri',
    'camera.uploadFailed': 'Ngarkimi dështoi',
    'camera.tryAgain': 'Provo përsëri',
    'camera.captureError': 'Nuk u kap fotoja.',
    'camera.reelFailed': 'Reel dështoi',
    'camera.recordingError': 'Nuk u ruajt reel-i.',
    'camera.zoom': 'zoom',
    'camera.quality': 'Cilësia',
    'camera.previewTitle': 'Shiko foton',
    'camera.previewHint': 'Nëse nuk të pëlqen, rikthehu dhe provo përsëri para se ta dërgosh.',
    'camera.retake': 'Riprovo',
    'camera.sendPhoto': 'Dërgo',
    'home.brand': 'Momenti Im',
    'home.greeting': 'Kamera jote e dasmës',
    'home.guest': 'Përshëndetje, {name}',
    'home.loading': 'Duke ngarkuar rrotën…',
    'home.yourKeepsakes': 'Kujtimet e tua',
    'home.viewAll': 'Shiko të gjitha',
    'home.noEvent': 'Kujtimi yt i radhës të pret',
    'home.joinEvent': 'Bashkohu në event',
    'home.scanQr': 'Skano QR',
    'memories.title': 'Kujtime',
    'memories.subtitle': 'Çdo event bëhet një kuti filmi në raft — prek për të hapur një kujtim.',
    'memories.emptyTitle': 'Ende pa kujtime të zhvilluara',
    'memories.emptyHint': 'Eventi yt i parë do të bëhet një kujtim që do ta kthesh përsëri.',
    'memories.developed': 'Momente · E zhvilluar',
    'memories.developing': 'Duke u zhvilluar…',
    'memories.tapOpen': 'Prek për të hapur →',
    'profile.editHint': 'Prek për të ndryshuar',
    'profile.save': 'Ruaj',
    'profile.yourName': 'Emri yt',
    'profile.journey': 'Udhëtimi yt',
    'profile.events': 'evente',
    'profile.moments': 'momente të kapura',
    'profile.memoriesDeveloped': 'kujtime të zhvilluara',
    'profile.achievements': 'Arritjet',
    'profile.preferences': 'Preferencat',
    'profile.language': 'Gjuha',
    'profile.notifications': 'Njoftimet',
    'profile.privacy': 'Privatësia',
    'profile.support': 'Ndihmë',
    'profile.notificationsTitle': 'Njoftimet',
    'profile.notificationsBody':
      'Do të të njoftojmë kur albumi zhvillohet dhe kur hosti publikon kujtimet e reja.',
    'profile.privacyTitle': 'Privatësia',
    'profile.privacyBody':
      'Fotot dhe mesazhet e tua ruhen vetëm për eventin. Mund t\'i fshish vetë në çdo kohë.',
    'profile.helpTitle': 'Ndihmë',
    'profile.helpBody': 'Na kontakto për çdo pyetje rreth eventit ose aplikacionit.',
    'profile.callSupport': 'Telefono / WhatsApp / Viber',
    'profile.close': 'Mbyll',
    'profile.guest': 'Mysafir',
    'profile.achievement.firstWedding': 'Dasma e Parë',
    'profile.achievement.hundredMoments': '100 Momente',
    'profile.achievement.nightPhotographer': 'Fotograf Nate',
    'profile.achievement.reelMaker': 'Krijues Reel',
    'join.title': 'Bashkohu në event',
    'join.subtitle': 'Vendos kodin nga ftesa ose skano QR-në.',
    'join.placeholder': 'Kodi i dhomës',
    'join.button': 'Hyr në dhomë',
    'join.codeError': 'Vendos kodin 6-shifror të dhomës',
    'join.scanButton': 'Skano QR',
    'join.note': 'Eventet krijohen nga hosti. Nuk mund të krijosh dhoma në aplikacionin e mysafirëve.',
    'home.moreKeepsakes': 'Më shumë kujtime',
    'home.seeAll': 'Shiko të gjitha',
    'home.open': 'Hap',
    'home.joinCelebration': 'Bashkohu në një festim dhe merr kamerën tënde disposable.',
    'memories.moments': 'momente',
    'memories.developedShort': 'E zhvilluar',
    'memories.disposableCamera': 'Kamera Disposable',
    'album.developing': 'Ende duke u zhvilluar…',
    'album.developingHint':
      'Kujtimet do të shfaqen këtu kur hosti të zbulojë albumin — si pritja e filmit në errësirë.',
    'album.yourVoice': 'Mesazhet e tua me zë',
    'album.voiceHint': 'Vetëm ti i dëgjon këto në albumin tënd',
    'album.keepsakeAlbum': 'Album kujtimesh',
    'album.hostedBy': 'Organizuar nga {name}',
    'album.reels': 'reels',
    'album.watchReel': 'Shiko social reel',
    'album.findPhotos': 'Gjej fotot e mia',
    'album.viewOnly': 'Album vetëm për shikim — hosti nuk ka aktivizuar shkarkimin.',
    'album.emptyTitle': 'Ende pa momente në album',
    'album.emptyHint':
      'Fotot shfaqen këtu pasi hosti i publikon nga admini. Nëse sapo ke shkrepur, kërkoji organizatorit të shtypë "Publish to guest album" — ose në test mode, shkrepjet e reja shfaqen automatikisht.',
    'album.selectHint': 'Prek çdo moment për ta parë · rrëshqit për të lundruar',
    'album.selectMode': 'Prek për të zgjedhur foto & reels',
    'album.reel': 'Reel',
    'album.selected': '{n} të zgjedhura',
    'audio.title': 'Libri i zërit',
    'audio.hint': 'Regjistro një mesazh, dëgjoje, pastaj dërgoje kur të duket mirë.',
    'audio.remaining': '{n} mesazhe të mbetura',
    'audio.yourRecording': 'Regjistrimi yt',
    'audio.listenThenSend': 'Dëgjo, pastaj dërgo ose ri-regjistro',
    'audio.tapToRecord': 'Prek për të regjistruar',
    'audio.rerecord': 'Ri-regjistro',
    'audio.send': 'Dërgo mesazhin',
    'audio.close': 'Mbyll',
    'audio.micPermission': 'Mikrofoni',
    'audio.micPermissionHint': 'Lejo mikrofonin për të lënë një mesazh me zë.',
    'audio.saved': 'Mesazhi u ruajt',
    'audio.savedHint': 'Shënimi yt me zë është në librin e mysafirëve.',
    'audio.recordingError': 'Gabim regjistrimi',
    'audio.voiceMessage': 'Mesazh me zë',
    'scavenger.title': 'I Spy — Gjuetia e fotove',
    'scavenger.subtitle': '{done}/{total} përfunduar · zgjidh një, pastaj bëj një foto',
    'find.title': 'Gjej fotot e mia',
    'find.hint': 'Bëj një selfie të shpejtë — do të gjejmë çdo foto ku je ti.',
    'find.enableCamera': 'Aktivizo kamerën për selfie',
    'find.search': 'Gjej fotot e mia',
    'find.yours': 'E jotja',
    'find.noMatches': 'Ende pa përputhje',
    'find.noMatchesHint': 'Fotot do të shfaqen ndërsa mysafirët ngarkojnë dhe albumi zhvillohet.',
    'find.searchFailed': 'Kërkimi dështoi',
    'scan.title': 'Qasja në skaner',
    'scan.hint': 'Lejo kamerën për të lexuar kodin QR nga tabela e hostit.',
    'scan.enable': 'Lejo kamerën',
    'scan.back': 'Kthehu',
    'scan.align': 'Vendos QR-në brenda kornizës',
    'scan.sources': 'Tabela · Ekrani i hostit · Kartela të printuara',
    'event.joining': 'Duke u bashkuar në event…',
    'event.joinFailed': 'Nuk u arrit të bashkohesh në event',
    'home.live': 'Live',
    'home.guests': '{n} mysafirë',
    'home.celebration': 'Festimi i sotëm',
    'home.captureCelebration': 'Kap festimin',
    'home.cameraReady': 'Kamera jote është gati',
    'home.ceremonySoon': 'Ceremonia fillon së shpejti',
    'home.ceremonyUnderway': 'Ceremonia është në zhvillim',
    'home.memoriesAwait': 'Kujtimet e sotme të presin',
    'home.shotsLeft': 'foto të mbetura',
    'home.reelsLeft': 'reels të mbetura',
    'home.album': 'album',
    'home.ready': 'Gati',
    'home.soon': 'Së shpejti',
    'home.viewAlbum': 'Shiko albumin',
    'home.opensIn': 'Hapet për {hours}h {minutes}m',
    'home.openCamera': 'Hap kamerën',
    'home.filmRoll': 'Rrotë filmi',
    'home.activeEvent': 'Event aktiv',
    'home.collecting': 'Duke mbledhur',
    'home.developmentIn': 'Zhvillim për',
    'home.yourMemories': 'Kujtimet e tua',
    'common.guest': 'Mysafir',
    'common.delete': 'Fshi',
    'common.cancel': 'Anulo',
    'common.confirm': 'Konfirmo',
    'common.tryAgain': 'Provo përsëri',
    'delete.photoTitle': 'Fshi foton?',
    'delete.photoMessage': 'Kjo foto do të hiqet nga albumi dhe do të marrësh përsëri një ekspozim.',
    'delete.audioTitle': 'Fshi mesazhin?',
    'delete.audioMessage': 'Mesazhi yt me zë do të fshihet përgjithmonë.',
    'delete.success': 'U fshi',
    'delete.failed': 'Nuk u fshi',
    'album.filterAll': 'Të gjitha',
    'album.filterPhotos': 'Foto',
    'album.filterVideos': 'Video',
    'album.show': 'Shfaq',
    'album.playSlideshow': 'Luaj slideshow',
    'album.slideshowSub': '{n} momente · avancim automatik',
    'album.actions': 'Veprime',
    'album.done': 'Gati',
    'album.select': 'Zgjidh',
    'album.saveAll': 'Ruaj të gjitha',
    'album.share': 'Ndaj',
    'album.saveSelected': 'Ruaj {n} të zgjedhura',
    'album.selectBelow': 'Prek fotot ose reels më poshtë për të zgjedhur',
    'album.savingLibrary': 'Duke ruajtur në librari…',
    'album.downloadingPhoto': 'Duke shkarkuar foton',
    'album.downloadingReel': 'Duke shkarkuar reel-in',
    'album.saved': 'U ruajt',
    'album.couldNotSave': 'Nuk u ruajt',
    'album.savedMoment': '{type} u ruajt në librarinë tënde.',
    'album.checkPermissions': 'Kontrollo lejet e medias në Cilësime.',
    'album.couldNotShare': 'Nuk u nda',
    'album.sharingUnavailable': 'Ndarja nuk është e disponueshme në këtë pajisje.',
    'album.selectMoments': 'Zgjidh momentet',
    'album.selectMomentsHint': 'Prek foto ose reels në modalitetin Zgjidh për të zgjedhur.',
    'album.savingCount': 'Duke ruajtur {n} moment(e)…',
    'album.toCameraRoll': 'Në albumin e kamerës',
    'album.partialSaved': '{saved} moment(e) u ruajtën · {failed} dështuan',
    'album.saveEntireAlbum': 'Ruaj të gjithë albumin',
    'album.saveAllConfirm': 'Ruaj të gjitha {n} momentet në albumin e kamerës?',
    'album.albumSaved': 'Albumi u ruajt',
    'share.opening': 'Duke hapur fletën e ndarjes…',
    'share.chooseWhere': 'Zgjidh ku ta dërgosh',
    'share.loadingMoment': 'Duke ngarkuar momentin…',
    'share.preparing': 'Duke përgatitur për ndarje…',
    'share.justMoment': 'Vetëm një moment',
    'lightbox.swipeHint': 'Rrëshqit majtas ose djathtas për të lundruar',
    'lightbox.pauseSlideshow': 'Ndalo slideshow',
    'lightbox.resumeSlideshow': 'Vazhdo slideshow',
    'reel.playerSubtitle': 'Social reel · gati për screen-record & post',
    'reel.notReady': 'Reel ende nuk është gati — kthehu pas dorëzimit.',
    'exposure.ofRemaining': '{remaining} nga {total} ekspozime të mbetura',
    'film.label': 'FILM',
    'profile.enableNotifications': 'Aktivizo njoftimet',
    'profile.notificationsOn': 'Njoftimet janë aktive',
    'profile.viewPrivacyPolicy': 'Lexo politikën e privatësisë',
    'profile.whatsapp': 'WhatsApp',
    'profile.viber': 'Viber',
    'profile.instagram': 'Instagram',
    'camera.previewReelTitle': 'Shiko reel-in',
    'camera.previewReelHint': 'Dëgjoje, pastaj dërgoje ose ri-regjistro.',
    'camera.sendReel': 'Dërgo reel',
    'camera.previewGalleryHint': 'Kontrollo foton para se ta dërgosh.',
    'home.tonight': 'Sonte',
    'home.revealReady': 'Gati për zbulim',
    'home.revealsTomorrow': 'Zhvillohet nesër',
    'home.revealsOn': 'Zhvillohet më {date}',
    'greeting.morning': 'Mirëmëngjes',
    'greeting.afternoon': 'Mirëdita',
    'greeting.evening': 'Mirëmbrëma',
    'upload.guestLimitExceeded': 'Nuk ke më foto të mbetura.',
    'upload.eventPoolExhausted': 'Ky event ka arritur limitin e fotove.',
    'upload.eventNotActive': 'Ky event nuk pranon më foto.',
    'upload.reservationExpired': 'Rezervimi skadoi. Provo përsëri.',
    'upload.failed': 'Ngarkimi dështoi.',
    'upload.fileMissing': 'Skedari i zgjedhur nuk ekziston më.',
    'upload.photoReadFailed': 'Fotoja nuk u lexua. Provo përsëri.',
    'upload.permissionDeniedCamera': 'Leja për kamerën u refuzua.',
    'upload.permissionDeniedGallery': 'Leja për galerinë u refuzua.',
    'upload.videoLimitExceeded': 'Nuk ke më reel (maks. 3).',
    'upload.videoNotAllowed': 'Video është e çaktivizuar për këtë event.',
    'upload.videoTooShort': 'Klipi është shumë i shkurtër — mbaj të paktën 3 sekonda.',
    'upload.videoTooLong': 'Gjatësia maksimale e reel-it është 1 minutë.',
    'upload.videoFileMissing': 'Skedari video nuk u gjet.',
    'upload.notJoined': 'Nuk je bashkuar në një event.',
    'upload.unknown': 'Ndodhi një gabim i papritur.',
    'push.requiresDevice': 'Njoftimet kërkojnë një pajisje fizike.',
    'push.permissionDenied': 'Leja për njoftimet u refuzua.',
    'push.notSignedIn': 'Nuk je i identifikuar.',
    'push.registerFailed': 'Nuk u regjistrua tokeni i njoftimit.',
    'referral.banner': 'Powered by Momenti Im — dëshiron këtë për eventin tënd?',
  },
  en: {
    'tabs.home': 'Home',
    'tabs.camera': 'Camera',
    'tabs.keepsakes': 'Keepsakes',
    'tabs.profile': 'Profile',
    'camera.noEvent': 'No active event',
    'camera.noEventHint': 'Join an event from Home to load your film.',
    'camera.permission': 'Camera access',
    'camera.permissionHint': 'Required to capture moments on your roll.',
    'camera.enableCamera': 'Enable camera',
    'camera.photo': 'Photo',
    'camera.reel': 'Reel',
    'camera.iSpy': 'I Spy',
    'camera.voice': 'Voice',
    'camera.uploadFailed': 'Upload failed',
    'camera.tryAgain': 'Try again',
    'camera.captureError': 'Could not capture photo.',
    'camera.reelFailed': 'Reel failed',
    'camera.recordingError': 'Could not save reel.',
    'camera.zoom': 'zoom',
    'camera.quality': 'Quality',
    'camera.previewTitle': 'Review photo',
    'camera.previewHint': "If it doesn't look right, retake before sending.",
    'camera.retake': 'Retake',
    'camera.sendPhoto': 'Send',
    'home.brand': 'Momenti Im',
    'home.greeting': 'Your wedding camera',
    'home.guest': 'Hello, {name}',
    'home.loading': 'Loading your roll…',
    'home.yourKeepsakes': 'Your keepsakes',
    'home.viewAll': 'View all',
    'home.noEvent': 'Your next keepsake awaits',
    'home.joinEvent': 'Join an event',
    'home.scanQr': 'Scan QR',
    'memories.title': 'Keepsakes',
    'memories.subtitle': 'Every event becomes a film box on your shelf — tap to open a memory.',
    'memories.emptyTitle': 'No developed memories yet',
    'memories.emptyHint': "Your first event will become a keepsake you'll revisit forever.",
    'memories.developed': 'moments · Developed',
    'memories.developing': 'Developing…',
    'memories.tapOpen': 'Tap to open →',
    'profile.editHint': 'Tap to edit',
    'profile.save': 'Save',
    'profile.yourName': 'Your name',
    'profile.journey': 'Your journey',
    'profile.events': 'events',
    'profile.moments': 'moments captured',
    'profile.memoriesDeveloped': 'memories developed',
    'profile.achievements': 'Achievements',
    'profile.preferences': 'Preferences',
    'profile.language': 'Language',
    'profile.notifications': 'Notifications',
    'profile.privacy': 'Privacy',
    'profile.support': 'Support',
    'profile.notificationsTitle': 'Notifications',
    'profile.notificationsBody':
      "We'll notify you when the album develops and when the host publishes new memories.",
    'profile.privacyTitle': 'Privacy',
    'profile.privacyBody':
      'Your photos and voice notes stay within the event. You can delete them anytime.',
    'profile.helpTitle': 'Help',
    'profile.helpBody': 'Contact us with any questions about your event or the app.',
    'profile.callSupport': 'Call / WhatsApp / Viber',
    'profile.close': 'Close',
    'profile.guest': 'Guest',
    'profile.achievement.firstWedding': 'First Wedding',
    'profile.achievement.hundredMoments': '100 Moments',
    'profile.achievement.nightPhotographer': 'Night Photographer',
    'profile.achievement.reelMaker': 'Reel Maker',
    'join.title': 'Join event',
    'join.subtitle': 'Enter the code from your invite or scan the QR.',
    'join.placeholder': 'Room code',
    'join.button': 'Enter room',
    'join.codeError': 'Enter the 6-character room code',
    'join.scanButton': 'Scan QR code',
    'join.note': 'Events are created by your host. You cannot create rooms in the guest app.',
    'home.moreKeepsakes': 'More keepsakes',
    'home.seeAll': 'See all',
    'home.open': 'Open',
    'home.joinCelebration': 'Join a celebration and receive your disposable camera.',
    'memories.moments': 'moments',
    'memories.developedShort': 'Developed',
    'memories.disposableCamera': 'Disposable Camera',
    'album.developing': 'Still developing…',
    'album.developingHint':
      'Your memories will appear here when the host reveals the album — like waiting for film in the darkroom.',
    'album.yourVoice': 'Your voice messages',
    'album.voiceHint': 'Only you can hear these in your keepsake album',
    'album.keepsakeAlbum': 'Keepsake album',
    'album.hostedBy': 'Hosted by {name}',
    'album.reels': 'reels',
    'album.watchReel': 'Watch social reel',
    'album.findPhotos': 'Find my photos',
    'album.viewOnly': "View-only album — the hosts haven't enabled downloads or sharing.",
    'album.emptyTitle': 'No moments in the album yet',
    'album.emptyHint':
      'Photos land here after the host publishes them from the admin vault. If you just shot photos, ask the organizer to tap "Publish to guest album" — or in test mode, new shots appear automatically.',
    'album.selectHint': 'Tap any moment to view · swipe to browse',
    'album.selectMode': 'Tap to select photos & reels',
    'album.reel': 'Reel',
    'album.selected': '{n} selected',
    'audio.title': 'Voice guestbook',
    'audio.hint': 'Record a message, listen back, then send when it feels right.',
    'audio.remaining': '{n} messages left',
    'audio.yourRecording': 'Your recording',
    'audio.listenThenSend': 'Listen, then send or re-record',
    'audio.tapToRecord': 'Tap to record',
    'audio.rerecord': 'Re-record',
    'audio.send': 'Send message',
    'audio.close': 'Close',
    'audio.micPermission': 'Microphone',
    'audio.micPermissionHint': 'Allow microphone access to leave a voice message.',
    'audio.saved': 'Message saved',
    'audio.savedHint': 'Your voice note is in the guestbook.',
    'audio.recordingError': 'Recording error',
    'audio.voiceMessage': 'Voice message',
    'scavenger.title': 'I Spy — Photo hunt',
    'scavenger.subtitle': '{done}/{total} completed · tap one, then snap a photo',
    'find.title': 'Find my photos',
    'find.hint': "Take a quick selfie — we'll find every shot you're in.",
    'find.enableCamera': 'Enable camera for selfie',
    'find.search': 'Find my photos',
    'find.yours': 'Yours',
    'find.noMatches': 'No matches yet',
    'find.noMatchesHint': 'Your photos will appear as guests upload and the album develops.',
    'find.searchFailed': 'Search failed',
    'scan.title': 'Scanner access',
    'scan.hint': 'Allow camera access to read the host table sign.',
    'scan.enable': 'Allow camera',
    'scan.back': 'Back',
    'scan.align': 'Align the QR within the frame',
    'scan.sources': 'Table signs · Admin screen · Printed cards',
    'event.joining': 'Joining event…',
    'event.joinFailed': 'Could not join event',
    'home.live': 'Live',
    'home.guests': '{n} guests',
    'home.celebration': "Tonight's celebration",
    'home.captureCelebration': 'Capture the celebration',
    'home.cameraReady': 'Your camera is ready',
    'home.ceremonySoon': 'The ceremony begins soon',
    'home.ceremonyUnderway': 'The ceremony is underway',
    'home.memoriesAwait': "Tonight's memories await",
    'home.shotsLeft': 'shots left',
    'home.reelsLeft': 'reels left',
    'home.album': 'album',
    'home.ready': 'Ready',
    'home.soon': 'Soon',
    'home.viewAlbum': 'View album',
    'home.opensIn': 'Opens {hours}h {minutes}m',
    'home.openCamera': 'Open camera',
    'home.filmRoll': 'Film roll',
    'home.activeEvent': 'Active event',
    'home.collecting': 'Collecting',
    'home.developmentIn': 'Development in',
    'home.yourMemories': 'Your memories',
    'common.guest': 'Guest',
    'common.delete': 'Delete',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.tryAgain': 'Try again',
    'delete.photoTitle': 'Delete photo?',
    'delete.photoMessage': 'This photo will be removed and you will get your exposure back.',
    'delete.audioTitle': 'Delete message?',
    'delete.audioMessage': 'Your voice message will be permanently deleted.',
    'delete.success': 'Deleted',
    'delete.failed': 'Could not delete',
    'album.filterAll': 'All',
    'album.filterPhotos': 'Photos',
    'album.filterVideos': 'Videos',
    'album.show': 'Show',
    'album.playSlideshow': 'Play slideshow',
    'album.slideshowSub': '{n} moments · auto-advance',
    'album.actions': 'Actions',
    'album.done': 'Done',
    'album.select': 'Select',
    'album.saveAll': 'Save all',
    'album.share': 'Share',
    'album.saveSelected': 'Save {n} selected',
    'album.selectBelow': 'Tap photos or reels below to select',
    'album.savingLibrary': 'Saving to library…',
    'album.downloadingPhoto': 'Downloading photo',
    'album.downloadingReel': 'Downloading reel',
    'album.saved': 'Saved',
    'album.couldNotSave': 'Could not save',
    'album.savedMoment': '{type} saved to your library.',
    'album.checkPermissions': 'Check media permissions in Settings.',
    'album.couldNotShare': 'Could not share',
    'album.sharingUnavailable': 'Sharing is not available on this device.',
    'album.selectMoments': 'Select moments',
    'album.selectMomentsHint': 'Tap photos or reels while in Select mode to choose what to save.',
    'album.savingCount': 'Saving {n} moment(s)…',
    'album.toCameraRoll': 'To your camera roll',
    'album.partialSaved': '{saved} moment(s) saved · {failed} failed',
    'album.saveEntireAlbum': 'Save entire album',
    'album.saveAllConfirm': 'Save all {n} moments to your camera roll?',
    'album.albumSaved': 'Album saved',
    'share.opening': 'Opening share sheet…',
    'share.chooseWhere': 'Choose where to send it',
    'share.loadingMoment': 'Loading moment…',
    'share.preparing': 'Preparing to share…',
    'share.justMoment': 'Just a moment',
    'lightbox.swipeHint': 'Swipe left or right to browse',
    'lightbox.pauseSlideshow': 'Pause slideshow',
    'lightbox.resumeSlideshow': 'Resume slideshow',
    'reel.playerSubtitle': 'Social reel · ready to screen-record & post',
    'reel.notReady': 'Reel not ready yet — check back after delivery.',
    'exposure.ofRemaining': '{remaining} of {total} exposures remaining',
    'film.label': 'FILM',
    'profile.enableNotifications': 'Enable notifications',
    'profile.notificationsOn': 'Notifications are on',
    'profile.viewPrivacyPolicy': 'Read privacy policy',
    'profile.whatsapp': 'WhatsApp',
    'profile.viber': 'Viber',
    'profile.instagram': 'Instagram',
    'camera.previewReelTitle': 'Review reel',
    'camera.previewReelHint': 'Watch it, then send or re-record.',
    'camera.sendReel': 'Send reel',
    'camera.previewGalleryHint': 'Check the photo before sending.',
    'home.tonight': 'Tonight',
    'home.revealReady': 'Ready to reveal',
    'home.revealsTomorrow': 'Develops tomorrow',
    'home.revealsOn': 'Develops {date}',
    'greeting.morning': 'Good morning',
    'greeting.afternoon': 'Good afternoon',
    'greeting.evening': 'Good evening',
    'upload.guestLimitExceeded': 'You have no photos remaining.',
    'upload.eventPoolExhausted': 'This event has reached its photo limit.',
    'upload.eventNotActive': 'This event is no longer accepting photos.',
    'upload.reservationExpired': 'Upload reservation expired. Please try again.',
    'upload.failed': 'Upload failed.',
    'upload.fileMissing': 'Selected file no longer exists.',
    'upload.photoReadFailed': 'Photo could not be read from your device. Try again.',
    'upload.permissionDeniedCamera': 'Camera permission denied.',
    'upload.permissionDeniedGallery': 'Gallery permission denied.',
    'upload.videoLimitExceeded': 'No video reels remaining (3 max).',
    'upload.videoNotAllowed': 'Video is disabled for this event.',
    'upload.videoTooShort': 'Clip too short — hold at least 3 seconds.',
    'upload.videoTooLong': 'Maximum reel length is 1 minute.',
    'upload.videoFileMissing': 'Video file not found.',
    'upload.notJoined': 'Not joined to an event.',
    'upload.unknown': 'An unexpected error occurred.',
    'push.requiresDevice': 'Push notifications require a physical device.',
    'push.permissionDenied': 'Notification permission denied.',
    'push.notSignedIn': 'Not signed in.',
    'push.registerFailed': 'Could not register push token.',
    'referral.banner': 'Powered by Momenti Im — want this for your event?',
  },
  de: {
    'tabs.home': 'Start',
    'tabs.camera': 'Kamera',
    'tabs.keepsakes': 'Erinnerungen',
    'tabs.profile': 'Profil',
    'camera.noEvent': 'Kein aktives Event',
    'camera.noEventHint': 'Tritt über Start einem Event bei, um deine Rolle zu laden.',
    'camera.permission': 'Kamerazugriff',
    'camera.permissionHint': 'Erforderlich, um Momente auf deiner Rolle festzuhalten.',
    'camera.enableCamera': 'Kamera aktivieren',
    'camera.photo': 'Foto',
    'camera.reel': 'Reel',
    'camera.iSpy': 'I Spy',
    'camera.voice': 'Stimme',
    'camera.uploadFailed': 'Upload fehlgeschlagen',
    'camera.tryAgain': 'Erneut versuchen',
    'camera.captureError': 'Foto konnte nicht aufgenommen werden.',
    'camera.reelFailed': 'Reel fehlgeschlagen',
    'camera.recordingError': 'Reel konnte nicht gespeichert werden.',
    'camera.zoom': 'Zoom',
    'camera.quality': 'Qualität',
    'camera.previewTitle': 'Foto prüfen',
    'camera.previewHint': 'Wenn es nicht passt, neu aufnehmen, bevor du sendest.',
    'camera.retake': 'Neu aufnehmen',
    'camera.sendPhoto': 'Senden',
    'home.brand': 'Momenti Im',
    'home.greeting': 'Deine Hochzeitskamera',
    'home.guest': 'Hallo, {name}',
    'home.loading': 'Rolle wird geladen…',
    'home.yourKeepsakes': 'Deine Erinnerungen',
    'home.viewAll': 'Alle anzeigen',
    'home.noEvent': 'Deine nächste Erinnerung wartet',
    'home.joinEvent': 'Event beitreten',
    'home.scanQr': 'QR scannen',
    'memories.title': 'Erinnerungen',
    'memories.subtitle': 'Jedes Event wird eine Filmdose im Regal — tippe, um eine Erinnerung zu öffnen.',
    'memories.emptyTitle': 'Noch keine entwickelten Erinnerungen',
    'memories.emptyHint': 'Dein erstes Event wird zu einer Erinnerung fürs Leben.',
    'memories.developed': 'Momente · Entwickelt',
    'memories.developing': 'Wird entwickelt…',
    'memories.tapOpen': 'Tippen zum Öffnen →',
    'profile.editHint': 'Tippen zum Bearbeiten',
    'profile.save': 'Speichern',
    'profile.yourName': 'Dein Name',
    'profile.journey': 'Deine Reise',
    'profile.events': 'Events',
    'profile.moments': 'Momente festgehalten',
    'profile.memoriesDeveloped': 'Erinnerungen entwickelt',
    'profile.achievements': 'Erfolge',
    'profile.preferences': 'Einstellungen',
    'profile.language': 'Sprache',
    'profile.notifications': 'Benachrichtigungen',
    'profile.privacy': 'Datenschutz',
    'profile.support': 'Support',
    'profile.notificationsTitle': 'Benachrichtigungen',
    'profile.notificationsBody':
      'Wir benachrichtigen dich, wenn das Album entwickelt wird und neue Erinnerungen veröffentlicht werden.',
    'profile.privacyTitle': 'Datenschutz',
    'profile.privacyBody':
      'Deine Fotos und Sprachnachrichten bleiben im Event. Du kannst sie jederzeit löschen.',
    'profile.helpTitle': 'Hilfe',
    'profile.helpBody': 'Kontaktiere uns bei Fragen zu deinem Event oder der App.',
    'profile.callSupport': 'Anrufen / WhatsApp / Viber',
    'profile.close': 'Schließen',
    'profile.guest': 'Gast',
    'profile.achievement.firstWedding': 'Erste Hochzeit',
    'profile.achievement.hundredMoments': '100 Momente',
    'profile.achievement.nightPhotographer': 'Nachtfotograf',
    'profile.achievement.reelMaker': 'Reel-Ersteller',
    'join.title': 'Event beitreten',
    'join.subtitle': 'Gib den Code von der Einladung ein oder scanne den QR-Code.',
    'join.placeholder': 'Raumcode',
    'join.button': 'Raum betreten',
    'join.codeError': 'Gib den 6-stelligen Raumcode ein',
    'join.scanButton': 'QR scannen',
    'join.note': 'Events werden vom Gastgeber erstellt. Du kannst keine Räume in der Gäste-App erstellen.',
    'home.moreKeepsakes': 'Weitere Erinnerungen',
    'home.seeAll': 'Alle anzeigen',
    'home.open': 'Öffnen',
    'home.joinCelebration': 'Tritt einem Fest bei und erhalte deine Einwegkamera.',
    'memories.moments': 'Momente',
    'memories.developedShort': 'Entwickelt',
    'memories.disposableCamera': 'Einwegkamera',
    'album.developing': 'Wird noch entwickelt…',
    'album.developingHint':
      'Deine Erinnerungen erscheinen hier, wenn der Gastgeber das Album freigibt.',
    'album.yourVoice': 'Deine Sprachnachrichten',
    'album.voiceHint': 'Nur du hörst diese in deinem Erinnerungsalbum',
    'album.keepsakeAlbum': 'Erinnerungsalbum',
    'album.hostedBy': 'Veranstaltet von {name}',
    'album.reels': 'Reels',
    'album.watchReel': 'Social Reel ansehen',
    'album.findPhotos': 'Meine Fotos finden',
    'album.viewOnly': 'Nur Ansicht — Downloads und Teilen sind deaktiviert.',
    'album.emptyTitle': 'Noch keine Momente im Album',
    'album.emptyHint':
      'Fotos erscheinen hier, nachdem der Host sie im Admin veröffentlicht. In Testmodus erscheinen neue Aufnahmen automatisch.',
    'album.selectHint': 'Tippe auf einen Moment · wische zum Blättern',
    'album.selectMode': 'Tippe, um Fotos & Reels auszuwählen',
    'album.reel': 'Reel',
    'album.selected': '{n} ausgewählt',
    'audio.title': 'Sprachgästebuch',
    'audio.hint': 'Nimm eine Nachricht auf, höre sie an und sende sie, wenn sie passt.',
    'audio.remaining': '{n} Nachrichten übrig',
    'audio.yourRecording': 'Deine Aufnahme',
    'audio.listenThenSend': 'Anhören, dann senden oder neu aufnehmen',
    'audio.tapToRecord': 'Tippen zum Aufnehmen',
    'audio.rerecord': 'Neu aufnehmen',
    'audio.send': 'Nachricht senden',
    'audio.close': 'Schließen',
    'audio.micPermission': 'Mikrofon',
    'audio.micPermissionHint': 'Erlaube Mikrofonzugriff für eine Sprachnachricht.',
    'audio.saved': 'Nachricht gespeichert',
    'audio.savedHint': 'Deine Sprachnachricht ist im Gästebuch.',
    'audio.recordingError': 'Aufnahmefehler',
    'audio.voiceMessage': 'Sprachnachricht',
    'scavenger.title': 'I Spy — Fotosuche',
    'scavenger.subtitle': '{done}/{total} erledigt · wähle eine Aufgabe, dann fotografiere',
    'find.title': 'Meine Fotos finden',
    'find.hint': 'Mach ein schnelles Selfie — wir finden jedes Foto mit dir.',
    'find.enableCamera': 'Kamera für Selfie aktivieren',
    'find.search': 'Meine Fotos finden',
    'find.yours': 'Deins',
    'find.noMatches': 'Noch keine Treffer',
    'find.noMatchesHint': 'Deine Fotos erscheinen, wenn Gäste hochladen und das Album entwickelt wird.',
    'find.searchFailed': 'Suche fehlgeschlagen',
    'scan.title': 'Scanner-Zugriff',
    'scan.hint': 'Erlaube Kamerazugriff, um den QR-Code zu lesen.',
    'scan.enable': 'Kamera erlauben',
    'scan.back': 'Zurück',
    'scan.align': 'QR-Code in den Rahmen legen',
    'scan.sources': 'Tischschilder · Admin-Bildschirm · Gedruckte Karten',
    'event.joining': 'Event wird beigetreten…',
    'event.joinFailed': 'Event-Beitritt fehlgeschlagen',
    'home.live': 'Live',
    'home.guests': '{n} Gäste',
    'home.celebration': 'Heutige Feier',
    'home.captureCelebration': 'Feiere den Moment',
    'home.cameraReady': 'Deine Kamera ist bereit',
    'home.ceremonySoon': 'Die Zeremonie beginnt bald',
    'home.ceremonyUnderway': 'Die Zeremonie läuft',
    'home.memoriesAwait': 'Die Erinnerungen von heute warten',
    'home.shotsLeft': 'Aufnahmen übrig',
    'home.reelsLeft': 'Reels übrig',
    'home.album': 'Album',
    'home.ready': 'Bereit',
    'home.soon': 'Bald',
    'home.viewAlbum': 'Album ansehen',
    'home.opensIn': 'Öffnet in {hours}h {minutes}m',
    'home.openCamera': 'Kamera öffnen',
    'home.filmRoll': 'Filmrolle',
    'home.activeEvent': 'Aktives Event',
    'home.collecting': 'Sammeln',
    'home.developmentIn': 'Entwicklung in',
    'home.yourMemories': 'Deine Erinnerungen',
    'common.guest': 'Gast',
    'common.delete': 'Löschen',
    'common.cancel': 'Abbrechen',
    'common.confirm': 'Bestätigen',
    'common.tryAgain': 'Erneut versuchen',
    'delete.photoTitle': 'Foto löschen?',
    'delete.photoMessage': 'Dieses Foto wird entfernt und du erhältst deine Aufnahme zurück.',
    'delete.audioTitle': 'Nachricht löschen?',
    'delete.audioMessage': 'Deine Sprachnachricht wird dauerhaft gelöscht.',
    'delete.success': 'Gelöscht',
    'delete.failed': 'Löschen fehlgeschlagen',
    'album.filterAll': 'Alle',
    'album.filterPhotos': 'Fotos',
    'album.filterVideos': 'Videos',
    'album.show': 'Anzeigen',
    'album.playSlideshow': 'Diashow abspielen',
    'album.slideshowSub': '{n} Momente · automatisch',
    'album.actions': 'Aktionen',
    'album.done': 'Fertig',
    'album.select': 'Auswählen',
    'album.saveAll': 'Alle speichern',
    'album.share': 'Teilen',
    'album.saveSelected': '{n} ausgewählte speichern',
    'album.selectBelow': 'Tippe unten auf Fotos oder Reels zum Auswählen',
    'album.savingLibrary': 'Wird in der Mediathek gespeichert…',
    'album.downloadingPhoto': 'Foto wird heruntergeladen',
    'album.downloadingReel': 'Reel wird heruntergeladen',
    'album.saved': 'Gespeichert',
    'album.couldNotSave': 'Speichern fehlgeschlagen',
    'album.savedMoment': '{type} in deiner Mediathek gespeichert.',
    'album.checkPermissions': 'Prüfe Medienberechtigungen in den Einstellungen.',
    'album.couldNotShare': 'Teilen fehlgeschlagen',
    'album.sharingUnavailable': 'Teilen ist auf diesem Gerät nicht verfügbar.',
    'album.selectMoments': 'Momente auswählen',
    'album.selectMomentsHint': 'Tippe im Auswahlmodus auf Fotos oder Reels.',
    'album.savingCount': 'Speichere {n} Moment(e)…',
    'album.toCameraRoll': 'In deine Mediathek',
    'album.partialSaved': '{saved} gespeichert · {failed} fehlgeschlagen',
    'album.saveEntireAlbum': 'Gesamtes Album speichern',
    'album.saveAllConfirm': 'Alle {n} Momente in der Mediathek speichern?',
    'album.albumSaved': 'Album gespeichert',
    'share.opening': 'Teilen-Dialog wird geöffnet…',
    'share.chooseWhere': 'Wähle, wohin du senden möchtest',
    'share.loadingMoment': 'Moment wird geladen…',
    'share.preparing': 'Teilen wird vorbereitet…',
    'share.justMoment': 'Einen Moment',
    'lightbox.swipeHint': 'Wische links oder rechts zum Blättern',
    'lightbox.pauseSlideshow': 'Diashow pausieren',
    'lightbox.resumeSlideshow': 'Diashow fortsetzen',
    'reel.playerSubtitle': 'Social Reel · bereit zum Aufnehmen & Posten',
    'reel.notReady': 'Reel noch nicht bereit — später erneut versuchen.',
    'exposure.ofRemaining': '{remaining} von {total} Aufnahmen übrig',
    'film.label': 'FILM',
    'profile.enableNotifications': 'Benachrichtigungen aktivieren',
    'profile.notificationsOn': 'Benachrichtigungen sind aktiv',
    'profile.viewPrivacyPolicy': 'Datenschutzerklärung lesen',
    'profile.whatsapp': 'WhatsApp',
    'profile.viber': 'Viber',
    'profile.instagram': 'Instagram',
    'camera.previewReelTitle': 'Reel prüfen',
    'camera.previewReelHint': 'Ansehen, dann senden oder neu aufnehmen.',
    'camera.sendReel': 'Reel senden',
    'camera.previewGalleryHint': 'Foto vor dem Senden prüfen.',
    'home.tonight': 'Heute Abend',
    'home.revealReady': 'Bereit zur Freigabe',
    'home.revealsTomorrow': 'Wird morgen entwickelt',
    'home.revealsOn': 'Entwickelt am {date}',
    'greeting.morning': 'Guten Morgen',
    'greeting.afternoon': 'Guten Tag',
    'greeting.evening': 'Guten Abend',
    'upload.guestLimitExceeded': 'Keine Fotos mehr übrig.',
    'upload.eventPoolExhausted': 'Dieses Event hat das Fotolimit erreicht.',
    'upload.eventNotActive': 'Dieses Event nimmt keine Fotos mehr an.',
    'upload.reservationExpired': 'Reservierung abgelaufen. Bitte erneut versuchen.',
    'upload.failed': 'Upload fehlgeschlagen.',
    'upload.fileMissing': 'Die ausgewählte Datei existiert nicht mehr.',
    'upload.photoReadFailed': 'Foto konnte nicht gelesen werden. Erneut versuchen.',
    'upload.permissionDeniedCamera': 'Kamerazugriff verweigert.',
    'upload.permissionDeniedGallery': 'Galeriezugriff verweigert.',
    'upload.videoLimitExceeded': 'Keine Video-Reels mehr (max. 3).',
    'upload.videoNotAllowed': 'Video ist für dieses Event deaktiviert.',
    'upload.videoTooShort': 'Clip zu kurz — mindestens 3 Sekunden halten.',
    'upload.videoTooLong': 'Maximale Reel-Länge ist 1 Minute.',
    'upload.videoFileMissing': 'Videodatei nicht gefunden.',
    'upload.notJoined': 'Keinem Event beigetreten.',
    'upload.unknown': 'Ein unerwarteter Fehler ist aufgetreten.',
    'push.requiresDevice': 'Push-Benachrichtigungen erfordern ein physisches Gerät.',
    'push.permissionDenied': 'Benachrichtigungsberechtigung verweigert.',
    'push.notSignedIn': 'Nicht angemeldet.',
    'push.registerFailed': 'Push-Token konnte nicht registriert werden.',
    'referral.banner': 'Powered by Momenti Im — willst du das für dein Event?',
  },
};
