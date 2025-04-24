
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { User, Service } from "@/lib/types";
import { services, reviews } from "@/lib/mock-data";
import ServiceCard from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Calendar, Mail, Phone, ArrowLeft, Star } from "lucide-react";
import { useUser } from "@/hooks/useUsers";

const ProviderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: provider, isLoading } = useUser(id || '');
  const [providerServices, setProviderServices] = useState<Service[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);

  useEffect(() => {
    if (id) {
      // Filter services by providerId
      const foundServices = services.filter(service => service.providerId === id);
      setProviderServices(foundServices);
      
      // Calculate average rating from reviews
      const providerReviews = reviews.filter(review => review.providerId === id);
      setReviewCount(providerReviews.length);
      
      if (providerReviews.length > 0) {
        const totalRating = providerReviews.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(totalRating / providerReviews.length);
      }
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="container px-4 py-12 md:px-6 md:py-16 text-center">
        <p>Carregando informações do profissional...</p>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="container px-4 py-12 md:px-6 md:py-16 text-center">
        <h2>Profissional não encontrado</h2>
        <Link to="/providers">
          <Button className="mt-4">Voltar para Profissionais</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <Link to="/providers" className="flex items-center gap-2 text-sm hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" />
        Voltar para Profissionais
      </Link>
      
      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        <div>
          <div className="overflow-hidden rounded-lg">
            <img
              src={provider.avatarUrl || provider.avatar_url}
              alt={provider.name}
              className="h-full w-full object-cover"
            />
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span>{provider.email}</span>
            </div>
            {provider.phoneNumber && (
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span>{provider.phoneNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>Ver disponibilidade</span>
            </div>
            
            <Button className="w-full">Agendar</Button>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{provider.name}</h1>
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">
                {averageRating.toFixed(1)} ({reviewCount})
              </span>
            </div>
          </div>
          
          {provider.specialties && provider.specialties.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {provider.specialties.map((specialty, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary"
                >
                  {specialty}
                </span>
              ))}
            </div>
          )}
          
          <div className="mt-8">
            <h2 className="text-xl font-bold">Serviços</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {providerServices.length > 0 ? (
                providerServices.map(service => (
                  <ServiceCard key={service.id} service={service} />
                ))
              ) : (
                <div className="col-span-full py-8 text-center">
                  <p>Este profissional ainda não cadastrou serviços.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-bold">Avaliações</h2>
            <div className="mt-4">
              {reviewCount > 0 ? (
                <div className="space-y-4">
                  {reviews
                    .filter(review => review.providerId === id)
                    .map(review => (
                      <div key={review.id} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">{review.date}</span>
                        </div>
                        <p className="mt-2">{review.comment}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p>Este profissional ainda não recebeu avaliações.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDetailPage;
