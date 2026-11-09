(ns local.frontend-test
  (:require [clojure.test :refer :all]
            [game.core.to-string :refer [card-str-edn]]))

(deftest serialized-corp-card-descriptions
  (let [base {:side "Corp" :type "ICE" :title "Palisade" :installed true :index 0}]
    (doseq [[zone server] [[[:servers :hq :ices] "hq"]
                          [[:servers :rd :ices] "rd"]
                          [[:servers :archives :ices] "archives"]]]
      (let [native (assoc base :zone zone)
            browser (assoc base :zone (mapv name zone))
            hidden (card-str-edn browser)
            seen (card-str-edn (assoc browser :rezzed true))]
        (is (= (card-str-edn native) hidden))
        (is (= :card-str-corp-installed-ice-unknown (:card/str hidden)))
        (is (= server (:server hidden)))
        (is (not (contains? hidden :title)) "Unrezzed card name stays hidden")
        (is (= "Palisade" (:title seen)))
        (is (= :card-str-corp-installed-ice-seen (:card/str seen)))))
    (let [remote {:side "Corp" :type "Asset" :title "Nico Campaign"
                  :installed true :zone ["servers" "remote2" "content"]}
          root (assoc remote :zone ["servers" "hq" "content"])
          host (assoc remote :zone ["onhost"] :host remote)]
      (is (= {:card/str :card-str-corp-installed-remote-unknown :server-n "2"}
             (card-str-edn remote)))
      (is (= {:card/str :card-str-corp-installed-central-unknown :server "hq"}
             (card-str-edn root)))
      (is (= {:card/str :card-str-corp-hosted-unknown :server "server 2" :server-n "2"}
             (card-str-edn host)))
      (is (= {:card/str :card-str-corp-scored :title "Nico Campaign"}
             (card-str-edn (assoc remote :zone ["scored"] :installed false)))))))

(let [{:keys [fail error]} (run-tests 'local.frontend-test)]
  (shutdown-agents)
  (System/exit (if (zero? (+ fail error)) 0 1)))
