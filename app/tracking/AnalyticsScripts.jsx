import Script from "next/script";
import { trackingConfig } from "./config";

export default function AnalyticsScripts() {
  const { googleAnalytics, microsoftClarity, mixpanel } = trackingConfig;

  return (
    <>
      {googleAnalytics.measurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalytics.measurementId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAnalytics.measurementId}');
            `}
          </Script>
        </>
      )}

      {microsoftClarity.projectId && (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${microsoftClarity.projectId}");
          `}
        </Script>
      )}

      {mixpanel.token && (
        <Script id="mixpanel" strategy="afterInteractive">
          {`
            (function(f,b){if(!b.__SV){var e,g,i,h;window.mixpanel=b;b._i=[];
            b.init=function(e,f,c){function g(a,d){var b=d.split(".");
            2==b.length&&(a=a[b[0]],d=b[1]);a[d]=function(){a.push([d].concat(
            Array.prototype.slice.call(arguments,0)))}}var a=b;"undefined"!==typeof c?a=b[c]=[]:c="mixpanel";
            a.people=a.people||[];a.toString=function(a){var d="mixpanel";"mixpanel"!==c&&(d+="."+c);
            a||(d+=" (stub)");return d};a.people.toString=function(){return a.toString(1)+".people (stub)"};
            i="disable time_event track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config reset people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user".split(" ");
            for(h=0;h<i.length;h++)g(a,i[h]);b._i.push([e,f,c])};
            b.__SV=1.2;e=f.createElement("script");e.type="text/javascript";e.async=!0;
            e.src="https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";
            g=f.getElementsByTagName("script")[0];g.parentNode.insertBefore(e,g)}})(document,window.mixpanel||[]);
            mixpanel.init("${mixpanel.token}", { track_pageview: true });
          `}
        </Script>
      )}
    </>
  );
}
