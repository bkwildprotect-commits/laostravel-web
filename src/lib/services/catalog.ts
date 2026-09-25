export const serviceCategories=[
{slug:"hotels",name:"Hotels",description:"Hotels and guesthouses"},
{slug:"restaurants",name:"Restaurants",description:"Local food and dining"},
{slug:"attractions",name:"Attractions",description:"Places to visit"},
{slug:"activities",name:"Tours & Activities",description:"Tours and local experiences"},
{slug:"transport",name:"Transport",description:"Local transfers and intercity travel"},
{slug:"map",name:"Map",description:"Explore services by location"},
{slug:"car-rental",name:"Car Rental",description:"Self-drive rental vehicles"},
{slug:"guides",name:"Guides",description:"Local guides and freelancers"}
] as const;
export type ServiceCategorySlug=(typeof serviceCategories)[number]["slug"];
export function isServiceCategory(value:string):value is ServiceCategorySlug{return serviceCategories.some(c=>c.slug===value)}
