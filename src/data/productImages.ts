// Product images - Generated DayZ style images
import vehicleGunterGen from '@/assets/products/vehicle-gunter-gen.jpg';
import vehicleAdaGen from '@/assets/products/vehicle-ada-gen.jpg';
import vehicleV3sGen from '@/assets/products/vehicle-v3s-gen.jpg';
import vehicleSarkaGen from '@/assets/products/vehicle-sarka-gen.jpg';
import vehicleOlgaGen from '@/assets/products/vehicle-olga-gen.jpg';
import vehicleHmmwvGen from '@/assets/products/vehicle-hmmwv-gen.jpg';
import vehicleBoatGen from '@/assets/products/vehicle-boat-gen.jpg';
import containerCrateGen from '@/assets/products/container-crate-gen.jpg';
import containerWeaponrackGen from '@/assets/products/container-weaponrack-gen.jpg';
import containerLockerGen from '@/assets/products/container-locker-gen.jpg';
import partsBatteryGen from '@/assets/products/parts-battery-gen.jpg';
import partsRadiatorGen from '@/assets/products/parts-radiator-gen.jpg';
import buildCodelockGen from '@/assets/products/build-codelock-gen.jpg';
import buildNailsGen from '@/assets/products/build-nails-gen.jpg';
import buildCamonetGen from '@/assets/products/build-camonet-gen.jpg';
import buildFlagpoleGen from '@/assets/products/build-flagpole-gen.jpg';
import priorityVipGen from '@/assets/products/priority-vip-gen.jpg';
import kitStarterGen from '@/assets/products/kit-starter-gen.jpg';

export const productImages: Record<string, string> = {
  // Пріоритет
  'priority-month': priorityVipGen,
  'priority-week': priorityVipGen,
  
  // Транспорт
  'vehicle-gunter': vehicleGunterGen,
  'vehicle-ada': vehicleAdaGen,
  'vehicle-olga': vehicleOlgaGen,
  'vehicle-v3s': vehicleV3sGen,
  'vehicle-hamer': vehicleGunterGen, // Similar hatchback
  'vehicle-sarka': vehicleSarkaGen,
  'vehicle-hmmwv': vehicleHmmwvGen,
  'vehicle-boat': vehicleBoatGen,
  'vehicle-niva': vehicleAdaGen, // Similar SUV
  'vehicle-volga': vehicleOlgaGen, // Similar sedan
  
  // Набори
  'kit-duo': kitStarterGen,
  'kit-trio': kitStarterGen,
  'kit-mid': kitStarterGen,
  'kit-big': kitStarterGen,
  
  // Будматеріали
  'build-codelock': buildCodelockGen,
  'build-nails': buildNailsGen,
  'build-flagpole': buildFlagpoleGen,
  'build-camonet': buildCamonetGen,
  
  // Контейнери
  'container-chest': containerCrateGen,
  'container-bigbox': containerCrateGen,
  'container-pallet': containerCrateGen,
  'container-weaponrack': containerWeaponrackGen,
  'container-military-locker': containerLockerGen,
  'container-personal-locker': containerLockerGen,
  
  // Запчастини
  'parts-radiator': partsRadiatorGen,
  'parts-sparkplug': partsBatteryGen, // Similar part
  'parts-battery': partsBatteryGen,
  'parts-canister': partsBatteryGen, // Placeholder
  'parts-key': buildCodelockGen, // Similar item
};

export default productImages;
