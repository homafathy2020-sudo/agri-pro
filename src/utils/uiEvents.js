// src/utils/uiEvents.js
//
// أسماء أحداث DOM بسيطة (window.dispatchEvent/addEventListener) بتستخدم
// للتواصل بين مكونات مش جوه شجرة props بعض (زي بانر في صفحة الداشبورد
// عايز يوجّه المستخدم لحقل موجود جوه Sidebar.jsx) — بديل خفيف عن context
// جديد لحالة استخدام واحدة بسيطة زي دي. الاسم مركزي هنا عشان الطرفين
// (اللي بيبعت والي بيستقبل) يستخدموا نفس الـ string بالظبط من غير تكرار.
export const FOCUS_FUEL_PRICE_EVENT = "app:focus-fuel-price";

// بيتبعت من Sidebar.jsx لما المستخدم يحفظ سعر الوقود بنجاح، عشان أي بانر
// تعريفي (FeatureIntroBanner) مرتبط بالميزة دي يقفل نفسه تلقائي — بدل ما
// يفضل ظاهر لحد ما المستخدم يقفله بإيده بعد ما خلاص عمل المطلوب.
export const FUEL_PRICE_SAVED_EVENT = "app:fuel-price-saved";
