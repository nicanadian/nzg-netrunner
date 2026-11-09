(ns comparison.scenarios
  (:require [clojure.test :refer :all]
            [cheshire.core :as json]
            [game.core :as core]
            [game.core.card :refer [get-counters]]
            [game.test-framework :refer :all]))

;; Executed inside the pinned, otherwise unmodified Jinteki checkout.
;; Initial positions are test fixtures; subsequent steps use its real actions.
(def results (atom {}))
(defn record! [id value] (swap! results assoc id value))
(defn success? [state] (boolean (seq (get-in @state [:runner :register :successful-run]))))
(defn overclock-fund [state]
  (if-let [c (find-card "Overclock" (get-in @state [:runner :play-area]))]
    (get-counters c :credit) 0))

(deftest overclock-manegarm
  (doseq [[id choice] [["overclock-manegarm-credits" "Pay 5 [Credits]"]
                       ["overclock-manegarm-clicks" "Spend [Click][Click]"]
                       ["overclock-manegarm-end" "End the run"]]]
    (do-game
      (new-game {:corp {:hand ["Manegarm Skunkworks"] :credits 20}
                 :runner {:hand ["Overclock"] :credits 6}})
      (play-from-hand state :corp "Manegarm Skunkworks" "New remote")
      (rez state :corp (get-content state :remote1 0))
      (take-credits state :corp)
      (play-from-hand state :runner "Overclock")
      (click-prompt state :runner "Server 1")
      (run-continue state)
      (run-continue state)
      (click-prompt state :runner choice)
      (when (= choice "Pay 5 [Credits]")
        (dotimes [_ 5] (click-card state :runner "Overclock")))
      (record! id {:pool (:credit (get-runner)) :clicks (:click (get-runner))
                   :overclock (overclock-fund state) :runActive (boolean (:run @state))}))))

(deftest whitespace-bad-publicity
  (doseq [initial [9 10]]
    (do-game
      (new-game {:corp {:hand ["Whitespace"] :credits 20 :bad-pub 5}
                 :runner {:credits initial}})
      (play-from-hand state :corp "Whitespace" "HQ")
      (take-credits state :corp)
      (run-on state :hq)
      (let [ice (get-ice state :hq 0)]
        (rez state :corp ice)
        (run-continue state)
        (card-subroutine state :corp ice 0)
        (let [after-loss {:pool (:credit (get-runner))
                          :fund (get-in @state [:run :bad-publicity-available])}]
          (card-subroutine state :corp ice 1)
          (record! (str "whitespace-" initial)
                   {:afterLoss after-loss :runActive (boolean (:run @state))
                    :fund (get-in @state [:run :bad-publicity-available] 0)}))))))

(deftest spin-doctor-during-run
  (doseq [iced? [true false]]
    (do-game
      (new-game {:corp {:hand (if iced? ["Spin Doctor" "Palisade"] ["Spin Doctor"])
                       :deck [(qty "Hedge Fund" 6)]
                       :discard ["Nico Campaign" "Regolith Mining License"] :credits 20}})
      (play-from-hand state :corp "Spin Doctor" "New remote")
      (when iced? (play-from-hand state :corp "Palisade" "Server 1"))
      (take-credits state :corp)
      (run-on state :remote1)
      (when iced? (run-continue state))
      (let [hand-before (count (:hand (get-corp)))
            spin (get-content state :remote1 0)]
        (rez state :corp spin)
        (card-ability state :corp spin 0)
        (click-card state :corp "Nico Campaign")
        (click-card state :corp "Regolith Mining License")
        (when (:run @state) (run-continue state))
        (record! (if iced? "spin-iced" "spin-empty")
                 {:drawn (- (count (:hand (get-corp))) hand-before)
                  :removed (boolean (find-card "Spin Doctor" (:rfg (get-corp))))
                  :shuffled (count (filter #(#{"Nico Campaign" "Regolith Mining License"} (:title %)) (:deck (get-corp))))
                  :runActive (boolean (:run @state)) :successful (success? state)})))))

(deftest leech-encounter-expiry
  (do-game
    (new-game {:corp {:hand ["Palisade"] :credits 20}
               :runner {:hand ["Leech" "Cleaver"] :credits 10}})
    (play-from-hand state :corp "Palisade" "New remote")
    (take-credits state :corp)
    (play-from-hand state :runner "Leech")
    (play-from-hand state :runner "Cleaver")
    (core/add-counter state :runner (core/make-eid state) (get-program state 0) :virus 2)
    (run-on state :remote1)
    (let [ice (get-ice state :remote1 0) leech (get-program state 0)]
      (rez state :corp ice)
      (run-continue state)
      (let [before (get-strength (refresh ice))]
        (card-ability state :runner leech 0)
        (let [during (get-strength (refresh ice))]
          (card-ability state :runner (get-program state 1) 0)
          (click-prompt state :runner "End the run")
          (run-continue state)
          (record! "leech" {:before before :during during :after (get-strength (refresh ice))
                            :counters (get-counters (refresh leech) :virus)}))))))

(deftest luminal-bonus-clicks
  (do-game
    (new-game {:corp {:hand ["Luminal Transubstantiation" "Offworld Office"] :credits 20}})
    (play-from-hand state :corp "Luminal Transubstantiation" "New remote")
    (play-from-hand state :corp "Offworld Office" "New remote")
    (doseq [server [:remote1 :remote2]]
      (core/add-prop state :corp (core/make-eid state) (get-content state server 0) :advance-counter 4))
    ;; Match our regression's last-click scoring window.
    (swap! state assoc-in [:corp :click] 0)
    (score state :corp (get-content state :remote1 0))
    (let [bonus (:click (get-corp)) pool (:credit (get-corp))]
      (score state :corp (get-content state :remote2 0))
      (let [other-scored (boolean (find-card "Offworld Office" (:scored (get-corp))))]
        (dotimes [_ 3] (click-credit state :corp))
        (record! "luminal" {:bonus bonus :otherScored other-scored
                            :clicks (:click (get-corp)) :creditsGained (- (:credit (get-corp)) pool)})))))

(deftest seamless-targets
  (doseq [target ["Palisade" "Leech"]]
    (do-game
      (new-game {:corp {:hand ["Palisade" "Seamless Launch" "Urtica Cipher"] :credits 20}
                 :runner {:hand ["Leech"] :credits 10}})
      (play-from-hand state :corp "Palisade" "HQ")
      (take-credits state :corp)
      (play-from-hand state :runner "Leech")
      (take-credits state :runner)
      (play-from-hand state :corp "Urtica Cipher" "New remote")
      (play-from-hand state :corp "Seamless Launch")
      (let [urtica (get-content state :remote1 0)
            card (if (= target "Palisade") (get-ice state :hq 0) (get-program state 0))]
        ;; Direct selection is deliberately invalid; the engine must reject it.
        (do-action "select" state :corp {:card urtica})
        (let [new-counters (get-counters (refresh urtica) :advancement)]
          (click-card state :corp card)
          ;; Rejection is a valid observation, not a harness failure. End the
          ;; still-open selection rather than pretending the effect resolved.
          (when (seq (prompt-buttons :corp)) (click-prompt state :corp "Done"))
          (record! (str "seamless-" target)
                   {:newCounters new-counters :targetCounters (get-counters (refresh card) :advancement)}))))))

(defn -main [& [output]]
  (let [summary (run-tests 'comparison.scenarios)]
    (spit output (json/generate-string {:engine "jinteki" :summary summary :scenarios @results} {:pretty true}))
    (shutdown-agents)
    (System/exit (if (zero? (+ (:fail summary) (:error summary))) 0 1))))
