# v241 — son kelime zamanlaması taşan kayıtlar

Kaynak hoca zamanlaması bazen bir âyetin son kelimesini sonraki âyete taşır. Önceki sürüm büyük taşmada bütün âyeti tek parça bırakıyordu. v241, taşan etiketlerin **yalnız son kelimeye ait** olduğunu ve son kelimenin kendi âyet aralığında başladığını doğrulayınca önceki kelimelerin bağımsız, güvenli parça sınırlarını kullanır. Son parçanın oynatma sınırı âyetin kendi bitişiyle sınırlıdır. Önceki kelimelere ait etiketler de ciddi biçimde çelişiyorsa tahmini kesim yapılmaz.

1254 hoca-sûre dosyasındaki iki mushaf yazımı için 137192 âyet durumu ve 676752 oynatma adımı tarandı. Yapısal plan hatası: 0. **8 veya daha fazla ses kelimesi içeren 332 durum hâlâ tek parça** (iki yazım birlikte, yaklaşık 166 hoca-âyet kaydı). 8 kelimeyi aşan 1286 parça var; bunların 1146'sı diğer parçaları ayrılabilen âyetlerin içinde. Kalan kaynak sorunları: 158 âyet durumunda büyük ve son kelimeyle sınırlı olmayan zamanlama çakışması, 28 durumda kelime konumu taşması, 10 durumda kelime zamanlamasının yokluğu. Bu sayılar iki yazımı ayrı sayar.

Bu tarama kaynak zamanlarının kendi iç tutarlılığını ve oynatma planını doğrular; tüm kayıtların akustik olarak uzman tarafından dinlendiği anlamına gelmez. Kaynak metadata çelişkisini gizlemek için rastgele süre oranlaması veya kelime ortasından kesim yapılmaz. Tam olarak “8+ kelimelik her âyet her hocada kısa ve doğru sesli parçaya ayrılır” iddiası henüz karşılanmıyor.

Yeniden denetim: `node scripts/verify-all-audio.mjs`. Ayrıntı: `test-results/full-validation.json`. Sınır vakası: `tests/fixtures/5-10-27.json`.
