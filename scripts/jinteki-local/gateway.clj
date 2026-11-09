(ns local.gateway
  (:require [clojure.string :as str]
            [monger.collection :as mc]
            [org.httpkit.server :as http]
            [web.auth :as auth]
            [web.app-state :as state]
            [web.core :as core]
            [web.game :as game]
            [web.lobby :as lobby]
            [web.system :as system]
            [web.user :as user]
            [web.ws :as ws]))

;; Development-only convenience routes. This wrapper always binds to loopback;
;; upstream auth, frontend and rules code remain unchanged.
(def context (atom nil))
(def running (atom nil))
(def names {[:beginner :corp] "GatewayBeginCorp"
            [:beginner :runner] "GatewayBeginRunner"
            [:intermediate :corp] "GatewayInterCorp"
            [:intermediate :runner] "GatewayInterRunner"})

(defn local-user! [db username]
  (when-not (mc/find-one-as-map db "users" {:username username})
    (mc/insert db "users"
      (assoc (user/create-user username (str (random-uuid)) (str username "@local.invalid"))
             :options {:default-format "system-gateway" :pronouns "none" :sounds false})))
  (-> (mc/find-one-as-map db "users" {:username username})
      (select-keys user/user-keys) (update :_id str)))

(defn teaching-game! [db users level]
  (let [corp (get users [level :corp]) runner (get users [level :runner])
        base (lobby/create-new-lobby
               {:uid (:username corp) :user corp
                :options {:side "Corp" :format "system-gateway"
                          :gateway-type (or (when (= level :intermediate) (System/getenv "JINTEKI_TEST_GAME"))
                                            (str/capitalize (name level)))
                          :room "casual" :title (str "Local Gateway — " (name level))
                          :allow-spectator false :save-replay true :open-decklists true}})
        match (update base :players conj {:uid (:username runner) :user runner :side "Runner"})
        id (:gameid match)]
    (swap! state/app-state assoc-in [:lobbies id] match)
    (game/try-start-game db (:username corp) id)
    (when-not (:state (state/get-lobby id))
      (throw (ex-info "Teaching matchup did not initialize" {:level level})))
    id))

(def launcher
  (str "<!doctype html><html><head><meta charset='utf-8'><title>Local Jinteki Gateway</title>"
       "<style>body{font:18px system-ui;background:#101923;color:#eee;max-width:760px;margin:60px auto;padding:24px}"
       "a{color:#80d4ff}section{padding:20px;background:#1d2b39;margin:20px 0;border-radius:10px}li{margin:14px 0}</style></head><body>"
       "<h1>Jinteki — local Gateway games</h1>"
       "<p>Two native teaching matches are ready. Each link signs in to a local account and opens the board at the opening-hand choice. Keep or mulligan on the Corp side first, then on the Runner side.</p>"
       "<p>Open Corp and Runner in separate tabs. The different hostnames keep their logins separate. This is two-player Jinteki: there is no AI opponent.</p>"
       "<section><h2>Beginner</h2><ul><li><a target='_blank' href='http://localhost:1042/local/beginner/corp'>Open Corp</a></li>"
       "<li><a target='_blank' href='http://127.0.0.1:1042/local/beginner/runner'>Open Runner</a></li></ul></section>"
       "<section><h2>Intermediate</h2><ul><li><a target='_blank' href='http://localhost:1042/local/intermediate/corp'>Open Corp</a></li>"
       "<li><a target='_blank' href='http://127.0.0.1:1042/local/intermediate/runner'>Open Runner</a></li></ul></section>"
       "<p>Use one matchup at a time in this browser. Switching matchups changes that side's login; reopen the matching link to return. Games stay in memory until the server stops.</p>"
       "<p>After a match ends, use New game → System Gateway → Beginner or Intermediate; join from the other side, then Start. Decks are selected automatically.</p>"
       "</body></html>"))

(defn wrap-local [handler]
  (fn [request]
    (if (= (:uri request) "/local")
      {:status 200 :headers {"Content-Type" "text/html; charset=utf-8" "Cache-Control" "no-store"} :body launcher}
      (if-let [[_ level side] (re-matches #"/local/(beginner|intermediate)/(corp|runner)" (:uri request))]
        (let [{:keys [users settings]} @context
              player (get users [(keyword level) (keyword side)])]
          (if player
            {:status 302 :headers {"Location" "/play" "Cache-Control" "no-store"
                                  "Set-Cookie" (str "session=" (auth/create-token settings player) "; Path=/; HttpOnly; SameSite=Lax")}
             :body "Opening local game"}
            {:status 503 :headers {} :body "Local games are starting"}))
        (handler request)))))

(defn -main [& _]
  (let [native-run http/run-server native-start system/start native-config system/server-config]
    (with-redefs [http/run-server (fn [handler options]
                                   (native-run (wrap-local handler) (assoc options :ip "127.0.0.1")))
                  system/start (fn [& args] (let [sys (apply native-start args)] (reset! running sys) sys))
                  system/server-config (fn [] (-> (native-config)
                                                  (assoc-in [:web/lobby :time-inactive] 86400)
                                                  (assoc-in [:web/server :port]
                                                    (Integer/parseInt (or (System/getenv "JINTEKI_LOCAL_PORT") "1042")))))]
      (core/-main)))
  (let [sys @running
        db (get-in sys [:mongodb/connection :db])
        users (into {} (map (fn [[key username]] [key (local-user! db username)]) names))
        native-close (get-method ws/-msg-handler :chsk/uidport-close)]
    ;; Keep the four local seats reserved when tabs close or change matchup.
    ;; Native Jinteki otherwise removes disconnected players and can delete a
    ;; game when its last tab closes. Explicit Leave/Concede still work normally.
    (.addMethod ws/-msg-handler :chsk/uidport-close
      (fn [{:keys [uid] :as event}]
        (if (contains? (set (vals names)) uid)
          (do (state/deregister-user! uid) (lobby/broadcast-lobby-list))
          (native-close event))))
    (reset! context {:users users :settings (:web/auth sys)})
    (doseq [level [:beginner :intermediate]] (teaching-game! db users level))
    (println "LOCAL_GATEWAY_READY http://localhost:1042/local")))
