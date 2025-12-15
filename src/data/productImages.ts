// Product images
import priorityMonth from '@/assets/products/priority-month.jpg';
import vehicleGunter from '@/assets/products/vehicle-gunter.jpg';
import vehicleAda from '@/assets/products/vehicle-ada.jpg';
import vehicleAdaOfficial from '@/assets/products/vehicle-ada-official.webp';
import vehicleV3s from '@/assets/products/vehicle-v3s.jpg';
import vehicleSarka from '@/assets/products/vehicle-sarka.jpg';
import kitDuo from '@/assets/products/kit-duo.jpg';
import kitBig from '@/assets/products/kit-big.jpg';
import buildCodelock from '@/assets/products/build-codelock.jpg';
import buildNails from '@/assets/products/build-nails.jpg';
import containerChest from '@/assets/products/container-chest.jpg';
import containerBigbox from '@/assets/products/container-bigbox.jpg';
import containerWeaponrack from '@/assets/products/container-weaponrack.jpg';
import partsBattery from '@/assets/products/parts-battery.jpg';

export const productImages: Record<string, string> = {
  'priority-month': priorityMonth,
  'priority-week': priorityMonth, // Same image for week
  'vehicle-gunter': vehicleGunter,
  'vehicle-ada': vehicleAdaOfficial,
  'vehicle-olga': vehicleAdaOfficial, // Similar vehicle
  'vehicle-v3s': vehicleV3s,
  'vehicle-hamer': vehicleGunter, // Similar vehicle
  'vehicle-sarka': vehicleSarka,
  'vehicle-hmmwv': vehicleGunter, // Similar military vehicle
  'vehicle-boat': vehicleAda, // Placeholder
  'vehicle-niva': vehicleSarka, // Similar compact
  'vehicle-volga': vehicleSarka, // Similar compact
  'kit-duo': kitDuo,
  'kit-trio': kitDuo, // Similar kit
  'kit-mid': kitBig, // Similar kit
  'kit-big': kitBig,
  'build-codelock': buildCodelock,
  'build-nails': buildNails,
  'build-flagpole': buildCodelock, // Placeholder
  'build-camonet': buildNails, // Placeholder
  'container-chest': containerChest,
  'container-bigbox': containerBigbox,
  'container-pallet': containerBigbox, // Similar storage
  'container-weaponrack': containerWeaponrack,
  'container-military-locker': containerBigbox,
  'container-personal-locker': containerBigbox,
  'parts-radiator': partsBattery,
  'parts-sparkplug': partsBattery,
  'parts-battery': partsBattery,
  'parts-canister': partsBattery,
  'parts-key': partsBattery,
};

export default productImages;
